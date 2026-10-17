/**
 * Our payment logic, provider-agnostic (only `./types` and `./providers` — never a vendor SDK):
 * - checkout: a place is held (application `held` + order `pending`, one transaction, under the
 *   capacity lock), then the provider's payment page — or done at once when nothing is due;
 * - applyPaymentUpdate: what the webhook (and the result page) run — the provider is asked, the
 *   change is applied once (statuses only forward), the follow-ups queued;
 * - an unpaid order lapses by its date (`expiresAt`, the application's `holdUntil`): nothing runs
 *   at the deadline; the place simply stops counting. Paying later (the e-mailed link) takes the
 *   place again if one is free (payOrder); cancelOrder lets it go at once.
 * Amounts are whole forints. Times UTC.
 */
import { randomBytes } from 'node:crypto';

import { sql } from '@payloadcms/db-postgres';
import type { Payload, PayloadRequest, TypedUser } from 'payload';

import { placesLeftFor } from '@/lib/applications/capacity';
import { canSignUpWorkshop } from '@/lib/applications/rules';
import {
  type ApplicantInput,
  applicantFor,
  applicantOf,
  countText,
  inTransaction,
  NOBODY,
  takenBy,
  validateInput,
  workshopFacts,
  workshopInfo,
} from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { issueInvoice } from '@/lib/invoicing/service';
import { whenText } from '@/lib/rooms/format';
import { icsFile } from '@/lib/rooms/ics';
import { errorMessage } from '@/lib/rooms/server';
import { dbOf } from '@/payload/db';
import { siteUrl } from '@/payload/email';
import { relId } from '@/payload/rel';
import type { Order, Payment, Session } from '@/payload-types';

import { sendLateRefund, sendOrderPaid, sendPaymentLink, sendStaffAlert, sendStaffPaid } from './notify';
import { paymentProvider } from './providers';
import { billingSettings, PAUSED } from './settings';
import { movesForward, type ProviderStatus, paidOrLater } from './types';

type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: string };

// ── settings, billing ───────────────────────────────────────────────────────

/** The buyer on the invoice (a snapshot on the order; the account keeps its own copy). */
export type Billing = { name: string; zip: string; city: string; address: string; country: string; taxNumber: string };

export function validateBilling(b: Billing): string | null {
  if (!b.name.trim()) return 'Add meg a számlázási nevet.';
  const country = b.country.trim().toUpperCase() || 'HU';
  if (!/^[A-Z]{2}$/.test(country)) return 'Az ország kétbetűs kódja kell (pl. HU).';
  if (country === 'HU' ? !/^\d{4}$/.test(b.zip.trim()) : !b.zip.trim()) return 'Add meg az irányítószámot.';
  if (!b.city.trim()) return 'Add meg a várost.';
  if (!b.address.trim()) return 'Add meg a címet (utca, házszám).';
  return null;
}

const clean = (b: Billing): Billing => ({
  name: b.name.trim(),
  zip: b.zip.trim(),
  city: b.city.trim(),
  address: b.address.trim(),
  country: b.country.trim().toUpperCase() || 'HU',
  taxNumber: b.taxNumber.trim(),
});

// ── checkout ────────────────────────────────────────────────────────────────

/** The result page's address: by the order's token, never its id. */
export const resultUrl = (token: string) => siteUrl(`/fizetes/eredmeny?rendeles=${encodeURIComponent(token)}`);
const webhookUrl = () => siteUrl('/api/payments/webhook');

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
): Promise<Result<{ token: string; checkoutUrl: string | null }>> {
  const invalid = validateInput({ ...input, kind: 'workshop' }, viewer) ?? validateBilling(input.billing);
  if (invalid) return { ok: false, reason: invalid };
  const billing = clean(input.billing);
  const [settings, billingRules] = await Promise.all([applicationSettings(payload), billingSettings(payload)]);
  if (!billingRules.online) return { ok: false, reason: PAUSED };

  const s = await payload.findByID({ collection: 'sessions', id: input.sessionId, depth: 0, disableErrors: true });
  if (s?.kind !== 'workshop') return { ok: false, reason: 'Nincs ilyen alkalom.' };
  const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
  const verdict = canSignUpWorkshop(workshopFacts(s, taken), now, settings);
  if (!verdict.ok) return verdict;

  const { applicant, created } = await applicantFor(payload, viewer, input);
  // the account's billing details: saved for the logged-in, or a brand-new account
  if (viewer || created)
    await payload.update({ collection: 'users', id: applicant.userId, data: { billing } }).catch(() => {});

  // back again with an unpaid order for the date (held or lapsed): the same order, a new payment
  const held = await payload.find({
    collection: 'applications',
    where: {
      and: [{ user: { equals: applicant.userId } }, { session: { equals: s.id } }, { status: { equals: 'held' } }],
    },
    depth: 1,
    limit: 1,
  });
  const heldOrder = held.docs[0]?.order;
  if (heldOrder && typeof heldOrder === 'object' && heldOrder.status === 'pending')
    return payOrder(payload, heldOrder, applicant.email, now);

  const price = Math.max(0, Math.round(s.workshop?.price ?? 0));
  const holdUntil = new Date(now.getTime() + billingRules.holdMinutes * 60_000);
  let order: Order;
  try {
    order = await inTransaction(payload, async (req) => {
      const application = await payload.create({
        collection: 'applications',
        data: {
          kind: 'workshop',
          user: applicant.userId,
          session: s.id,
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
          kind: 'workshop',
          label: `${s.displayTitle ?? 'Nyitott Műhely'} — ${whenText(s.start, s.end, 'long')}`,
          price,
          creditUsed: 0,
          amountDue: price,
          status: 'pending',
          expiresAt: holdUntil.toISOString(),
          billing,
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
  await sendPaymentLink(payload, applicant, await workshopInfo(payload, s, settings), {
    amount: order.amountDue,
    holdUntil: holdUntil.toISOString(),
    href: resultUrl(order.token),
  });
  return startPayment(payload, order, applicant.email);
}

/** An unpaid order whose hold ran out (by its date — nothing marks it). */
export const lapsed = (order: Pick<Order, 'status' | 'expiresAt'>, now: Date) =>
  order.status === 'pending' && Boolean(order.expiresAt) && new Date(order.expiresAt as string) <= now;

/**
 * Pay a pending order: a new payment. If its hold ran out, the place is taken again first —
 * when the date is still open and a place is free.
 */
async function payOrder(
  payload: Payload,
  order: Order,
  email: string,
  now: Date,
): Promise<Result<{ token: string; checkoutUrl: string | null }>> {
  if (!lapsed(order, now)) return startPayment(payload, order, email);
  const applicationId = relId(order.application);
  const a = applicationId
    ? await payload.findByID({ collection: 'applications', id: applicationId, depth: 0, disableErrors: true })
    : null;
  if (a?.status !== 'held') return { ok: false, reason: 'Ez a foglalás már nem érvényes; jelentkezz újra.' };
  const s = await payload.findByID({
    collection: 'sessions',
    id: relId(a.session) ?? 0,
    depth: 0,
    disableErrors: true,
  });
  if (!s) return { ok: false, reason: 'Nincs ilyen alkalom.' };
  const [settings, billingRules] = await Promise.all([applicationSettings(payload), billingSettings(payload)]);
  if (!billingRules.online) return { ok: false, reason: PAUSED };
  const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
  const verdict = canSignUpWorkshop(workshopFacts(s, taken), now, settings);
  if (!verdict.ok) return verdict;
  const holdUntil = new Date(now.getTime() + billingRules.holdMinutes * 60_000).toISOString();
  const renewed = await inTransaction(payload, async (req) => {
    const o = await lockOrder(req, order.id);
    if (o.status !== 'pending') return null;
    // pre-checked: a refusal inside the hook would roll the whole transaction back
    if ((await placesLeftFor(req, a, a.id)) === 0) return null;
    await payload.update({ collection: 'applications', id: a.id, data: { holdUntil }, req });
    return payload.update({ collection: 'orders', id: o.id, data: { expiresAt: holdUntil }, req });
  });
  if (!renewed) return { ok: false, reason: 'Ez az alkalom időközben megtelt.' };
  return startPayment(payload, renewed, email);
}

/** A new provider payment for a pending order (first try, or "Újrapróbálom"). */
export async function startPayment(
  payload: Payload,
  order: Order,
  email: string,
): Promise<Result<{ token: string; checkoutUrl: string | null }>> {
  const provider = paymentProvider();
  try {
    const p = await provider.createPayment({
      orderId: String(order.id),
      amount: order.amountDue,
      description: `${order.label} — Morpheus Színműhely`,
      customerEmail: email,
      // back from the payment page: the order page waits a little for the provider's answer
      returnUrl: `${resultUrl(order.token)}&vissza=1`,
      webhookUrl: webhookUrl(),
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
    return { ok: false, reason: 'A fizetés indítása nem sikerült. Próbáld újra pár perc múlva.' };
  }
}

/** Nothing due (free, or all from credit): paid without a provider. */
async function completeWithoutPayment(payload: Payload, orderId: number) {
  const done = await inTransaction(payload, async (req) => {
    const order = await lockOrder(req, orderId);
    if (order.status !== 'pending' || order.amountDue !== 0) return false;
    await confirmOrder(req, order);
    return true;
  });
  if (done) await queueFollowUps(payload, orderId);
}

// ── the provider's answer (webhook, result page, mock) ──────────────────────

async function lockOrder(req: PayloadRequest, id: number): Promise<Order> {
  const db = await dbOf(req.payload, req);
  await db.execute(sql`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`);
  return req.payload.findByID({ collection: 'orders', id, depth: 0, req });
}

/** Order paid, application registered (its hold ends). Inside the order's lock. */
async function confirmOrder(req: PayloadRequest, order: Order) {
  const applicationId = relId(order.application);
  if (applicationId)
    await req.payload.update({
      collection: 'applications',
      id: applicationId,
      data: { status: 'registered', holdUntil: null, cancelReason: null, cancelledAt: null },
      req,
    });
  await req.payload.update({
    collection: 'orders',
    id: order.id,
    data: { status: 'paid', paidAt: new Date().toISOString() },
    req,
  });
}

/** What to do after the transaction (provider calls and e-mails never run inside it). */
type Effect =
  | { type: 'paid'; orderId: number }
  | { type: 'mismatch'; orderId: number; providerPaymentId: string; expected: number; got: number }
  | { type: 'refund'; why: 'late' | 'duplicate'; orderId: number; paymentId: number; amount: number };

const LOG_KEEP = 30;

/**
 * Applies the provider's current state of a payment. Idempotent: the same id any number of times
 * has one effect (statuses only move forward, under the order's row lock). Returns what happened.
 */
export async function applyPaymentUpdate(
  payload: Payload,
  providerPaymentId: string,
  source: string,
  now = new Date(),
): Promise<'unknown' | 'unchanged' | 'updated'> {
  const found = await payload.find({
    collection: 'payments',
    where: { providerPaymentId: { equals: providerPaymentId } },
    depth: 0,
    limit: 1,
  });
  const known = found.docs[0];
  const provider = paymentProvider();
  if (!known || known.provider !== provider.name) return 'unknown';
  const truth = await provider.getPayment(providerPaymentId);

  const effects: Effect[] = [];
  const changed = await inTransaction(payload, async (req) => {
    const order = await lockOrder(req, relId(known.order) ?? 0);
    const payment = await payload.findByID({ collection: 'payments', id: known.id, depth: 0, req });
    const from = payment.status as ProviderStatus;
    const log = [
      ...(payment.log ?? []).map(({ at, source, status, note }) => ({ at, source, status, note })),
      { at: now.toISOString(), source, status: truth.status },
    ].slice(-LOG_KEEP);
    if (!movesForward(from, truth.status)) {
      await payload.update({ collection: 'payments', id: payment.id, data: { log }, req });
      return false;
    }
    await payload.update({
      collection: 'payments',
      id: payment.id,
      data: {
        status: truth.status,
        paidAt: truth.paidAt?.toISOString() ?? payment.paidAt,
        raw: truth.raw as Payment['raw'],
        log,
      },
      req,
    });
    // only the first time a payment counts as paid does anything follow
    if (!paidOrLater(truth.status) || paidOrLater(from)) return true;

    if (truth.amount !== order.amountDue) {
      effects.push({
        type: 'mismatch',
        orderId: order.id,
        providerPaymentId,
        expected: order.amountDue,
        got: truth.amount,
      });
      return true;
    }
    if (order.status === 'paid') {
      // the order was already paid by another payment (two tabs): this one goes back
      effects.push({
        type: 'refund',
        why: 'duplicate',
        orderId: order.id,
        paymentId: payment.id,
        amount: truth.amount,
      });
      return true;
    }
    if (await mayKeepPlace(req, order, now)) {
      await confirmOrder(req, order);
      effects.push({ type: 'paid', orderId: order.id });
    } else {
      await releaseHold(req, order, 'A fizetés a foglalási idő után érkezett; a hely közben betelt.');
      effects.push({ type: 'refund', why: 'late', orderId: order.id, paymentId: payment.id, amount: truth.amount });
    }
    return true;
  });

  for (const e of effects) await runEffect(payload, e);
  return changed ? 'updated' : 'unchanged';
}

/**
 * Can the paid application have its place? Within its hold, yes. After the hold ran out (late
 * payment), only if a place is still free and the person hasn't signed up for the date again.
 */
async function mayKeepPlace(req: PayloadRequest, order: Order, now: Date): Promise<boolean> {
  const id = relId(order.application);
  if (!id) return false;
  const a = await req.payload.findByID({ collection: 'applications', id, depth: 0, req });
  if (a.status === 'held' && a.holdUntil && new Date(a.holdUntil) > now) return true;
  if (a.status !== 'held' && a.status !== 'cancelled') return false;
  const again = await req.payload.count({
    collection: 'applications',
    where: {
      and: [
        { user: { equals: relId(a.user) } },
        { session: { equals: relId(a.session) } },
        { status: { in: ['held', 'registered'] } },
        { id: { not_equals: a.id } },
      ],
    },
    req,
  });
  if (again.totalDocs) return false;
  const left = await placesLeftFor(req, a, a.id);
  return left === null || left > 0;
}

async function runEffect(payload: Payload, e: Effect) {
  const settings = await applicationSettings(payload);
  if (e.type === 'paid') return queueFollowUps(payload, e.orderId);
  if (e.type === 'mismatch')
    return sendStaffAlert(payload, settings, 'eltérő fizetett összeg', [
      `A ${e.providerPaymentId} fizetés ${e.got} Ft-ról szól, a rendelés (#${e.orderId}) ${e.expected} Ft. A jelentkezést nem véglegesítettük.`,
      'Nézd meg a fizetést a szolgáltató felületén és a Rendelések között.',
    ]);
  await refundAutomatically(payload, e.orderId, e.paymentId, e.amount, e.why);
}

/** A late or duplicate payment goes back in full; the person and staff are told. */
async function refundAutomatically(
  payload: Payload,
  orderId: number,
  paymentId: number,
  amount: number,
  why: 'late' | 'duplicate',
) {
  const settings = await applicationSettings(payload);
  const payment = await payload.findByID({ collection: 'payments', id: paymentId, depth: 0 });
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1 });
  const provider = paymentProvider();
  try {
    const r = await provider.refund(
      payment.providerPaymentId,
      amount,
      `Visszatérítés #${orderId} (${why === 'late' ? 'késve érkezett' : 'kétszer fizetve'})`,
    );
    await payload.update({
      collection: 'payments',
      id: paymentId,
      data: {
        refunds: [
          ...(payment.refunds ?? []).map(({ providerRefundId, amount, at, by }) => ({
            providerRefundId,
            amount,
            at,
            by: relId(by),
          })),
          { providerRefundId: r.providerRefundId, amount, at: new Date().toISOString() },
        ],
      },
    });
    if (why === 'late') await payload.update({ collection: 'orders', id: orderId, data: { status: 'refunded' } });
  } catch (err) {
    payload.logger.error({ err, msg: `automatic refund failed for payment ${payment.providerPaymentId}` });
    await sendStaffAlert(payload, settings, 'az automatikus visszatérítés nem sikerült', [
      `A ${payment.providerPaymentId} fizetést (${amount} Ft, rendelés #${orderId}) vissza kellett volna utalni, de a szolgáltató hibát adott. Kérjük, intézd kézzel.`,
    ]);
    return;
  }
  const application = typeof order.application === 'object' ? order.application : null;
  if (why === 'late' && application) {
    const s = await payload.findByID({ collection: 'sessions', id: relId(application.session) ?? 0, depth: 0 });
    await sendLateRefund(payload, applicantOf(application), await workshopInfo(payload, s, settings), amount);
  }
  await sendStaffAlert(payload, settings, 'automatikus visszatérítés', [
    why === 'late'
      ? `A rendelés #${orderId} (${order.label}) fizetése a foglalási idő lejárta után érkezett, és a hely már betelt: ${amount} Ft-ot automatikusan visszautaltunk, a jelentkezőt értesítettük.`
      : `A rendelés #${orderId} (${order.label}) kétszer lett kifizetve: a második fizetést (${amount} Ft) automatikusan visszautaltuk.`,
  ]);
}

// ── after paying (a job: e-mails now, invoice and course membership later) ──

export const FOLLOW_UP_QUEUE = 'payments';

async function queueFollowUps(payload: Payload, orderId: number) {
  await payload.jobs.queue({ task: 'orderPaid', input: { orderId }, queue: FOLLOW_UP_QUEUE });
}

/** The `orderPaid` job: confirmation (with .ics) to the participant, a notice to staff. */
export async function afterPaid(payload: Payload, orderId: number) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1 });
  const application = typeof order.application === 'object' ? order.application : null;
  if (!application) return;
  const settings = await applicationSettings(payload);
  const user = typeof order.user === 'object' ? order.user : null;
  const applicant = applicantOf(application, user?.firstName);
  const money = { price: order.price, creditUsed: order.creditUsed, amountDue: order.amountDue };
  if (order.kind === 'workshop') {
    const s = await payload.findByID({ collection: 'sessions', id: relId(application.session) ?? 0, depth: 0 });
    const info = await workshopInfo(payload, s, settings);
    await sendOrderPaid(payload, applicant, info, money, {
      loggedIn: false,
      ics: workshopIcs(application.id, s, info),
    });
    const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
    await sendStaffPaid(payload, settings, applicant, info, money, countText(taken, s));
  }
  // the invoice (Számlázz.hu e-mails it); never throws — failures are stored and reported
  await issueInvoice(payload, orderId);
}

const workshopIcs = (applicationId: number, s: Session, info: { title: string; place?: string }) =>
  icsFile({
    uid: `application-${applicationId}@morpheus-szinmuhely.hu`,
    start: new Date(s.start),
    end: new Date(s.end),
    summary: `${info.title} — Morpheus Színműhely`,
    location: info.place,
  });

// ── letting a place go ────────────────────────────────────────────────────────────

/** "Mégse" on the result page: the person lets the place go. */
export async function cancelOrder(payload: Payload, token: string): Promise<Result> {
  const order = await orderByToken(payload, token);
  if (!order) return { ok: false, reason: 'Nincs ilyen rendelés.' };
  const done = await inTransaction(payload, async (req) => {
    const o = await lockOrder(req, order.id);
    if (o.status !== 'pending') return false;
    await releaseHold(req, o, 'Megszakította a fizetést.');
    await payload.update({ collection: 'orders', id: o.id, data: { status: 'canceled' }, req });
    return true;
  });
  return done ? { ok: true } : { ok: false, reason: 'Ez a rendelés már le van zárva.' };
}

async function releaseHold(req: PayloadRequest, order: Order, reason: string) {
  const id = relId(order.application);
  if (!id) return;
  const a = await req.payload.findByID({ collection: 'applications', id, depth: 0, req });
  if (a.status === 'held')
    await req.payload.update({
      collection: 'applications',
      id,
      data: { status: 'cancelled', cancelReason: reason, holdUntil: null },
      req,
    });
}

// ── the result page ─────────────────────────────────────────────────────────

export async function orderByToken(payload: Payload, token: string): Promise<Order | null> {
  if (!token || token.length < 20) return null;
  const { docs } = await payload.find({
    collection: 'orders',
    where: { token: { equals: token } },
    depth: 0,
    limit: 1,
  });
  return docs[0] ?? null;
}

export type OrderView = {
  status: Order['status'];
  label: string;
  amountDue: number;
  creditUsed: number;
  expiresAt: string | null;
  /** The last payment attempt failed / was cancelled. */
  lastFailed: boolean;
  /** Unpaid and the hold ran out: paying takes the place again if one is free. */
  lapsed: boolean;
  /** The provider is processing a payment (not just waiting for the person): worth waiting for. */
  processing: boolean;
  sessionId: number | null;
};

/**
 * The order as the result page shows it. While pending, the provider is asked about its latest
 * payment (the webhook may be slow, or unreachable in local testing) — still the provider's truth.
 */
export async function orderStatus(payload: Payload, token: string, now = new Date()): Promise<OrderView | null> {
  let order = await orderByToken(payload, token);
  if (!order) return null;
  const latest = async (o: Order) =>
    (
      await payload.find({
        collection: 'payments',
        where: { order: { equals: o.id } },
        sort: '-createdAt',
        depth: 0,
        limit: 1,
      })
    ).docs[0];
  let payment = await latest(order);
  if (order.status === 'pending' && (payment?.status === 'open' || payment?.status === 'pending')) {
    await applyPaymentUpdate(payload, payment.providerPaymentId, 'return', now).catch((err) =>
      payload.logger.error({ err, msg: 'payment status refresh failed' }),
    );
    order = (await orderByToken(payload, token)) ?? order;
    payment = await latest(order);
  }
  const application = relId(order.application)
    ? await payload.findByID({ collection: 'applications', id: relId(order.application) ?? 0, depth: 0 })
    : null;
  return {
    status: order.status,
    label: order.label,
    amountDue: order.amountDue,
    creditUsed: order.creditUsed,
    expiresAt: order.expiresAt ?? null,
    lastFailed: Boolean(payment && ['failed', 'expired', 'canceled'].includes(payment.status)),
    lapsed: lapsed(order, now),
    processing: payment?.status === 'pending',
    sessionId: relId(application?.session),
  };
}

/** "Fizetés" on the order page (also from the e-mailed link): a new payment for the same order. */
export async function retryPayment(payload: Payload, token: string, now = new Date()) {
  const order = await orderByToken(payload, token);
  if (order?.status !== 'pending') return { ok: false as const, reason: 'Ez a rendelés már le van zárva.' };
  const user = await payload.findByID({ collection: 'users', id: relId(order.user) ?? 0, depth: 0 });
  return payOrder(payload, order, user.email, now);
}
