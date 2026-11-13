/**
 * A Nyitott Műhely order's price and label. /fizetes prices by the logged-in visitor (what the page
 * shows is charged); the order page (and its e-mailed link) by the account the order belongs to.
 */
import type { Payload, PayloadRequest } from 'payload';

import { workshopPrice } from '@/lib/applications/rules';
import { applicationSettings } from '@/lib/applications/settings';
import { whenText } from '@/lib/rooms/format';
import { hasRole } from '@/payload/access';
import { relId } from '@/payload/rel';
import type { Order, Session } from '@/payload-types';

type Priced = { label: string; amount: number };

export function workshopOrder(session: Session, discountPercent: number, isStudent: boolean): Priced {
  const priced = workshopPrice(session.workshop?.price ?? 0, discountPercent, isStudent);
  return {
    label: [
      `${session.displayTitle ?? 'Nyitott Műhely'} — ${whenText(session.start, session.end, 'long')}`,
      priced.discountPercent ? ` (hallgatói ár, −${priced.discountPercent}%)` : '',
    ].join(''),
    amount: priced.price,
  };
}

/** Both prices of a workshop order's date: the account's own, and the other one (student or not). */
async function workshopOrderPrices(payload: Payload, order: Order, req?: PayloadRequest) {
  if (order.kind !== 'workshop') return null;
  const applicationId = relId(order.application);
  const application = applicationId
    ? await payload.findByID({ collection: 'applications', id: applicationId, depth: 0, disableErrors: true, req })
    : null;
  const sessionId = relId(application?.session);
  const session = sessionId
    ? await payload.findByID({ collection: 'sessions', id: sessionId, depth: 0, disableErrors: true, req })
    : null;
  if (!session) return null;
  const user = await payload.findByID({
    collection: 'users',
    id: relId(order.user) ?? 0,
    depth: 0,
    disableErrors: true,
    req,
  });
  const { studentDiscountPercent } = await applicationSettings(req ?? payload);
  const isStudent = hasRole(user, 'student');
  return {
    own: workshopOrder(session, studentDiscountPercent, isStudent),
    other: workshopOrder(session, studentDiscountPercent, !isStudent),
  };
}

/** What an unpaid workshop order costs its account now; null: not a workshop order (it keeps its price). */
export async function accountPrice(payload: Payload, order: Order): Promise<Priced | null> {
  return order.status === 'pending' ? ((await workshopOrderPrices(payload, order))?.own ?? null) : null;
}

/** An unpaid order takes a new price and label (nothing was paid yet). */
export async function repriced(
  payload: Payload,
  order: Order,
  now: Priced & { plan?: Order['plan'] },
  req?: PayloadRequest,
): Promise<Order> {
  if (order.amountDue === now.amount && order.label === now.label) return order;
  return payload.update({
    collection: 'orders',
    id: order.id,
    data: { label: now.label, price: now.amount, amountDue: now.amount, ...(now.plan ? { plan: now.plan } : {}) },
    req,
  });
}

/**
 * A payment went through for the amount it was started with, but the order's price changed since
 * (a student's price, or the full one): the order takes what was paid, so the invoice matches it.
 */
export async function atPaidAmount(req: PayloadRequest, order: Order, amount: number): Promise<Order> {
  if (order.amountDue === amount) return order;
  const prices = await workshopOrderPrices(req.payload, order, req);
  const label = [prices?.own, prices?.other].find((priced) => priced?.amount === amount)?.label ?? order.label;
  return repriced(req.payload, order, { label, amount }, req);
}
