/**
 * /fizetes/eredmeny?rendeles=<token>: the order as the person sees it, and "Mégse". Paying again is
 * retryPayment (checkout.ts).
 */
import type { Payload } from 'payload';

import { inTransaction } from '@/lib/applications/server';
import { relId } from '@/payload/rel';
import { uiTexts } from '@/payload/ui-texts';
import type { Order } from '@/payload-types';

import { lapsed, lockOrder, orderByToken, type Result, releaseHold } from './orders';
import { targetOf } from './target';
import { applyPaymentUpdate } from './updates';

export type OrderView = {
  status: Order['status'];
  /** A show's tickets read differently ("jegyvásárlás", not "jelentkezés"). */
  kind: Order['kind'];
  label: string;
  amountDue: number;
  expiresAt: string | null;
  /** The last payment attempt failed / was cancelled. */
  lastFailed: boolean;
  /** Unpaid and the hold ran out: paying takes the place again if one is free. */
  lapsed: boolean;
  /** The provider is processing a payment (not just waiting for the person): worth waiting for. */
  processing: boolean;
  /** The checkout to sign up again ("Újra jelentkezem"). */
  againPath: string | null;
};

const latestPayment = async (payload: Payload, o: Order) =>
  (
    await payload.find({
      collection: 'payments',
      where: { order: { equals: o.id } },
      sort: '-createdAt',
      depth: 0,
      limit: 1,
    })
  ).docs[0];

/**
 * The order as the result page shows it. While pending, the provider is asked about its latest
 * payment (the webhook may be slow, or unreachable in local testing) — still the provider's truth.
 */
export async function orderStatus(payload: Payload, token: string, now = new Date()): Promise<OrderView | null> {
  let order = await orderByToken(payload, token);
  if (!order) return null;
  let payment = await latestPayment(payload, order);
  if (order.status === 'pending' && (payment?.status === 'open' || payment?.status === 'pending')) {
    await applyPaymentUpdate(payload, payment.providerPaymentId, 'return', now).catch((err) =>
      payload.logger.error({ err, msg: 'payment status refresh failed' }),
    );
    order = (await orderByToken(payload, token)) ?? order;
    payment = await latestPayment(payload, order);
  }
  const applicationId = relId(order.application);
  const application = applicationId
    ? await payload.findByID({ collection: 'applications', id: applicationId, depth: 0, disableErrors: true })
    : null;
  return {
    status: order.status,
    kind: order.kind,
    label: order.label,
    amountDue: order.amountDue,
    expiresAt: order.expiresAt ?? null,
    lastFailed: Boolean(payment && ['failed', 'expired', 'canceled'].includes(payment.status)),
    lapsed: lapsed(order, now),
    processing: payment?.status === 'pending',
    againPath: application ? (await targetOf(payload, application, now)).againPath : null,
  };
}

/** "Mégse" on the order page: the person lets the place go. */
export async function cancelOrder(payload: Payload, token: string): Promise<Result> {
  const t = (await uiTexts(payload)).checkoutErrors;
  const order = await orderByToken(payload, token);
  if (!order) return { ok: false, reason: t.noOrder };
  const done = await inTransaction(payload, async (req) => {
    const o = await lockOrder(req, order.id);
    if (o.status !== 'pending') return false;
    await releaseHold(req, o, 'Megszakította a fizetést.');
    await payload.update({ collection: 'orders', id: o.id, data: { status: 'canceled' }, req });
    return true;
  });
  return done ? { ok: true } : { ok: false, reason: t.orderClosed };
}
