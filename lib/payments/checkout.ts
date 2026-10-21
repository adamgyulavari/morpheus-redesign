/**
 * The checkout: a Nyitott Műhely date (checkout) or a kezdő group (checkoutCourse). The place is
 * held (application `held` + order `pending`, one transaction, under the capacity lock), then the
 * provider's payment page — or done at once when nothing is due. An unpaid order lapses by its
 * date: nothing runs at the deadline. Paying later (the e-mailed link, the order page) takes the
 * place again if one is free (payOrder).
 */
import { randomBytes } from 'node:crypto';

import type { Payload, TypedUser, Where } from 'payload';

import { fits } from '@/lib/applications/capacity';
import type { Applicant, TargetInfo } from '@/lib/applications/notify';
import { canBookShow, canSignUpWorkshop } from '@/lib/applications/rules';
import {
  type ApplicantInput,
  applicantFor,
  courseInfo,
  inTransaction,
  NOBODY,
  signupKindOf,
  takenBy,
  validateInput,
  workshopFacts,
  workshopInfo,
} from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { ownHeldSeats, seatsTaken, showFacts, showInfo, ticketPrice } from '@/lib/applications/shows';
import { say } from '@/lib/messages';
import { whenText } from '@/lib/rooms/format';
import { errorMessage } from '@/lib/rooms/server';
import { siteUrl } from '@/payload/email';
import { relId } from '@/payload/rel';
import { uiTexts } from '@/payload/ui-texts';
import type { Application, Order } from '@/payload-types';

import { type Billing, clean, validateBilling } from './billing';
import { sendPaymentLink } from './notify';
import { cancelOrder } from './order-page';
import { confirmOrder, lapsed, lockOrder, orderByToken, queueFollowUps, type Result, resultUrl } from './orders';
import { paymentProvider } from './providers';
import { billingSettings } from './settings';
import { courseTarget, targetOf } from './target';

type Started = Result<{ token: string; checkoutUrl: string | null }>;

export type CheckoutInput = ApplicantInput & { sessionId: number; billing: Billing };

/**
 * A workshop sign-up with payment. The place is held for `ordersHoldMinutes`; the answer is the
 * provider's page to go to (null: nothing to pay, it is done).
 */
export async function checkout(
  payload: Payload,
  viewer: TypedUser | null,
  input: CheckoutInput,
  now = new Date(),
): Promise<Started> {
  const begun = await begin(payload, viewer, input, 'workshop');
  if (!begun.ok) return begun;

  const ui = await uiTexts(payload);
  const settings = await applicationSettings(payload);
  const s = await payload.findByID({ collection: 'sessions', id: input.sessionId, depth: 0, disableErrors: true });
  if (s?.kind !== 'workshop') return { ok: false, reason: ui.signupErrors.noSession };
  const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
  const verdict = canSignUpWorkshop(workshopFacts(s, taken), now, settings);
  if (!verdict.ok) return { ok: false, reason: say(ui.signupRules, verdict) };

  return order(payload, viewer, input, begun, now, {
    again: { session: { equals: s.id } },
    info: await workshopInfo(payload, s, settings),
    application: { kind: 'workshop', session: s.id },
    order: {
      kind: 'workshop',
      label: `${s.displayTitle ?? 'Nyitott Műhely'} — ${whenText(s.start, s.end, 'long')}`,
      amount: Math.max(0, Math.round(s.workshop?.price ?? 0)),
    },
  });
}

export type CourseCheckoutInput = ApplicantInput & {
  groupId: number;
  /** The chosen payment option (the group's "Fizetési lehetőségek"). */
  optionId: string;
  billing: Billing;
};

/** What is paid now for a payment option: all of it, or the first of its instalments. */
export function dueNow(option: { amount: number; installments?: number | null }) {
  const parts = Math.max(1, Math.round(option.installments ?? 1));
  return { parts, amount: Math.max(0, Math.round(option.amount / parts)) };
}

/**
 * A kezdő sign-up with payment: a group with "Online fizetés jelentkezéskor", one of its payment
 * options. Paid means admitted (after-paid.ts). Without a group the sign-up stays free.
 */
export async function checkoutCourse(
  payload: Payload,
  viewer: TypedUser | null,
  input: CourseCheckoutInput,
  now = new Date(),
): Promise<Started> {
  const begun = await begin(payload, viewer, input, 'beginner');
  if (!begun.ok) return begun;
  const ui = await uiTexts(payload);
  const t = ui.checkoutErrors;

  const group = await payload.findByID({
    collection: 'courseGroups',
    id: input.groupId,
    depth: 0,
    disableErrors: true,
  });
  if (!group || signupKindOf(group) !== 'beginner' || !group.signup?.payOnline)
    return { ok: false, reason: t.notThisWay };
  const option = (group.signup.options ?? []).find((o) => o.id === input.optionId);
  if (!option) return { ok: false, reason: t.chooseOption };
  const courseId = relId(group.course);
  const course = courseId
    ? await payload.findByID({ collection: 'courses', id: courseId, depth: 0, disableErrors: true })
    : null;
  if (!course) return { ok: false, reason: t.notThisWay };
  const target = await courseTarget(payload, course, group, now);
  if (!target.verdict.ok) return { ok: false, reason: say(ui.signupRules, target.verdict) };

  const { parts, amount } = dueNow(option);
  return order(payload, viewer, input, begun, now, {
    again: { courseGroup: { equals: group.id } },
    info: target.info,
    // the collection's hook sets the group's course
    application: { kind: 'beginner', courseGroup: group.id },
    order: {
      kind: 'beginner',
      label: [course.title, courseInfo(group).title, option.label]
        .join(' — ')
        .concat(parts > 1 ? ` (1. részlet a ${parts}-ből)` : ''),
      amount,
      plan: { label: option.label, total: option.amount, parts },
    },
  });
}

export type ShowCheckoutInput = ApplicantInput & { showId: number; seats: number; billing: Billing };

/** Tickets for a show booked on the site (a free one is booked without the checkout). */
export async function checkoutShow(
  payload: Payload,
  viewer: TypedUser | null,
  input: ShowCheckoutInput,
  now = new Date(),
): Promise<Started> {
  const begun = await begin(payload, viewer, input, 'show');
  if (!begun.ok) return begun;
  const ui = await uiTexts(payload);
  const s = await payload.findByID({ collection: 'shows', id: input.showId, depth: 1, disableErrors: true });
  if (s?.bookingMode !== 'internal' || ticketPrice(s) === 0)
    return { ok: false, reason: ui.checkoutErrors.showNotThisWay };
  const { maxPerBooking } = (await billingSettings(payload)).showDefaults;
  // their own hold (another number of tickets) is replaced: its seats are theirs to take
  const own = await ownHeldSeats(payload, s.id, viewer?.email ?? input.email);
  const taken = ((await seatsTaken(payload, [s.id])).get(s.id) ?? 0) - own;
  const verdict = canBookShow(showFacts(s, taken), input.seats, maxPerBooking, now);
  if (!verdict.ok) return { ok: false, reason: say(ui.signupRules, verdict) };
  const info = showInfo(s, input.seats);
  return order(payload, viewer, input, begun, now, {
    // back with the same number of tickets: the same order; another number replaces it
    again: { and: [{ show: { equals: s.id } }, { seats: { equals: input.seats } }] },
    replaces: { show: { equals: s.id } },
    info,
    application: { kind: 'show', show: s.id, seats: input.seats },
    order: {
      kind: 'show',
      label: `${info.title} — ${info.when} (${input.seats} jegy)`,
      amount: ticketPrice(s) * input.seats,
    },
  });
}

/** Both checkouts begin alike: the person's details and billing are valid, online payment is on. */
async function begin(
  payload: Payload,
  viewer: TypedUser | null,
  input: ApplicantInput & { billing: Billing },
  kind: Application['kind'],
): Promise<Result<{ billing: Billing; holdMinutes: number }>> {
  const ui = await uiTexts(payload);
  const invalid =
    validateInput({ ...input, kind }, viewer, ui.signupErrors) ?? validateBilling(input.billing, ui.billingErrors);
  if (invalid) return { ok: false, reason: invalid };
  const rules = await billingSettings(payload);
  if (!rules.online) return { ok: false, reason: ui.checkout.paused };
  return { ok: true, billing: clean(input.billing), holdMinutes: rules.holdMinutes };
}

type NewOrder = {
  /** The person's applications for the same thing. */
  again: Where;
  /** Their other unpaid orders this one replaces (a show with another number of tickets). */
  replaces?: Where;
  info: TargetInfo;
  application: Pick<Application, 'kind'> &
    Partial<Pick<Application, 'session' | 'courseGroup' | 'course' | 'show' | 'seats'>>;
  order: { kind: Order['kind']; label: string; amount: number; plan?: Order['plan'] };
};

/**
 * …and end alike: the account (its billing details saved), then the unpaid order it already has
 * for the same thing (paid again), or a new one.
 */
async function order(
  payload: Payload,
  viewer: TypedUser | null,
  input: ApplicantInput,
  { billing, holdMinutes }: { billing: Billing; holdMinutes: number },
  now: Date,
  d: NewOrder,
): Promise<Started> {
  const { applicant, created } = await applicantFor(payload, viewer, input);
  // the account's billing details: saved for the logged-in, or a brand-new account
  if (viewer || created)
    await payload.update({ collection: 'users', id: applicant.userId, data: { billing } }).catch(() => {});

  // back again with an unpaid order (held or lapsed): the same order, a new payment
  const again = await heldOrderOf(payload, applicant.userId, d.again);
  if (again) return payOrder(payload, again, applicant.email, now);
  const replaced = d.replaces && (await heldOrderOf(payload, applicant.userId, d.replaces));
  if (replaced) await cancelOrder(payload, replaced.token);
  return placeOrder(payload, applicant, billing, holdMinutes, now, d);
}

/** The person's unpaid order for this target (held, or its hold ran out), if any. */
async function heldOrderOf(payload: Payload, userId: number, target: Where): Promise<Order | null> {
  const held = await payload.find({
    collection: 'applications',
    where: { and: [{ user: { equals: userId } }, target, { status: { equals: 'held' } }] },
    depth: 1,
    limit: 1,
  });
  const o = held.docs[0]?.order;
  return o && typeof o === 'object' && o.status === 'pending' ? o : null;
}

/**
 * The held application and its order in one transaction (the capacity is counted under a lock by
 * the Applications collection), then the payment-link e-mail and the provider's page.
 */
async function placeOrder(
  payload: Payload,
  applicant: Applicant & { phone?: string | null },
  billing: Billing,
  holdMinutes: number,
  now: Date,
  d: NewOrder,
): Promise<Started> {
  const holdUntil = new Date(now.getTime() + holdMinutes * 60_000);
  let order: Order;
  try {
    order = await inTransaction(payload, async (req) => {
      const application = await payload.create({
        collection: 'applications',
        data: {
          ...d.application,
          user: applicant.userId,
          name: applicant.name,
          email: applicant.email,
          phone: applicant.phone,
          status: 'held',
          holdUntil: holdUntil.toISOString(),
        },
        req,
      });
      const o = await payload.create({
        collection: 'orders',
        data: {
          user: applicant.userId,
          application: application.id,
          kind: d.order.kind,
          label: d.order.label,
          price: d.order.amount,
          amountDue: d.order.amount,
          status: 'pending',
          expiresAt: holdUntil.toISOString(),
          billing,
          plan: d.order.plan,
          token: randomBytes(24).toString('base64url'),
        },
        req,
      });
      await payload.update({ collection: 'applications', id: application.id, data: { order: o.id }, req });
      return o;
    });
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }

  if (order.amountDue === 0) {
    await completeWithoutPayment(payload, order.id);
    return { ok: true, token: order.token, checkoutUrl: null };
  }
  // a backup: the order page, to pay later if the payment page was closed
  await sendPaymentLink(payload, applicant, d.info, {
    amount: order.amountDue,
    holdUntil: holdUntil.toISOString(),
    href: resultUrl(order.token),
  });
  return startPayment(payload, order, applicant.email);
}

/**
 * Pay a pending order: a new payment. If its hold ran out, the place is taken again first —
 * when the date is still open and a place is free.
 */
async function payOrder(payload: Payload, order: Order, email: string, now: Date): Promise<Started> {
  if (!lapsed(order, now)) return startPayment(payload, order, email);
  const ui = await uiTexts(payload);
  const t = ui.checkoutErrors;
  const applicationId = relId(order.application);
  const a = applicationId
    ? await payload.findByID({ collection: 'applications', id: applicationId, depth: 0, disableErrors: true })
    : null;
  if (a?.status !== 'held') return { ok: false, reason: t.holdGone };
  const rules = await billingSettings(payload);
  if (!rules.online) return { ok: false, reason: ui.checkout.paused };
  const { verdict } = await targetOf(payload, a, now);
  if (!verdict.ok) return { ok: false, reason: say(ui.signupRules, verdict) };
  const holdUntil = new Date(now.getTime() + rules.holdMinutes * 60_000).toISOString();
  const renewed = await inTransaction(payload, async (req) => {
    const o = await lockOrder(req, order.id);
    if (o.status !== 'pending') return null;
    // pre-checked: a refusal inside the hook would roll the whole transaction back
    if (!(await fits(req, a, a.id))) return null;
    await payload.update({ collection: 'applications', id: a.id, data: { holdUntil }, req });
    return payload.update({ collection: 'orders', id: o.id, data: { expiresAt: holdUntil }, req });
  });
  if (!renewed)
    return {
      ok: false,
      reason: a.kind === 'show' ? t.showSoldOut : a.kind === 'workshop' ? t.sessionFull : t.groupFull,
    };
  return startPayment(payload, renewed, email);
}

/** "Fizetés" on the order page (also from the e-mailed link): a new payment for the same order. */
export async function retryPayment(payload: Payload, token: string, now = new Date()): Promise<Started> {
  const o = await orderByToken(payload, token);
  if (o?.status !== 'pending') return { ok: false, reason: (await uiTexts(payload)).checkoutErrors.orderClosed };
  const user = await payload.findByID({ collection: 'users', id: relId(o.user) ?? 0, depth: 0 });
  return payOrder(payload, o, user.email, now);
}

/** A new provider payment for a pending order. */
async function startPayment(payload: Payload, order: Order, email: string): Promise<Started> {
  const provider = paymentProvider();
  try {
    const p = await provider.createPayment({
      orderId: String(order.id),
      amount: order.amountDue,
      description: `${order.label} — Morpheus Színműhely`,
      customerEmail: email,
      // back from the payment page: the order page waits a little for the provider's answer
      returnUrl: `${resultUrl(order.token)}&vissza=1`,
      webhookUrl: siteUrl('/api/payments/webhook'),
    });
    await payload.create({
      collection: 'payments',
      data: {
        order: order.id,
        provider: provider.name,
        providerPaymentId: p.providerPaymentId,
        amount: order.amountDue,
        status: 'open',
        log: [{ at: new Date().toISOString(), source: 'create', status: 'open' }],
      },
    });
    return { ok: true, token: order.token, checkoutUrl: p.checkoutUrl };
  } catch (err) {
    payload.logger.error({ err, msg: `payment start failed for order ${order.id}` });
    return { ok: false, reason: (await uiTexts(payload)).checkoutErrors.startFailed };
  }
}

/** Nothing due (a free date): paid without a provider. */
async function completeWithoutPayment(payload: Payload, orderId: number) {
  const done = await inTransaction(payload, async (req) => {
    const o = await lockOrder(req, orderId);
    if (o.status !== 'pending' || o.amountDue !== 0) return false;
    await confirmOrder(req, o);
    return true;
  });
  if (done) await queueFollowUps(payload, orderId);
}
