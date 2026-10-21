/**
 * The provider's answer about a payment (webhook, order page, mock): the provider is asked, the
 * change is applied once (statuses only forward, under the order's row lock), and what follows
 * runs after the transaction (provider calls and e-mails never run inside it).
 */
import type { Payload, PayloadRequest } from 'payload';

import { fits } from '@/lib/applications/capacity';
import { inTransaction } from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { relId } from '@/payload/rel';
import type { Order, Payment } from '@/payload-types';

import { sendStaffAlert } from './notify';
import { confirmOrder, lockOrder, queueFollowUps, releaseHold } from './orders';
import { paymentProvider } from './providers';
import { afterOrderRefund, refundAutomatically, refundedOf, refundRows } from './refunds';
import { sameTarget } from './target';
import { movesForward, type ProviderStatus, paidOrLater } from './types';

type Effect =
  | { type: 'paid'; orderId: number }
  | { type: 'mismatch'; orderId: number; providerPaymentId: string; expected: number; got: number }
  | { type: 'refund'; why: 'late' | 'duplicate'; orderId: number; paymentId: number; amount: number }
  | { type: 'refundedOutside'; order: Order; full: boolean; amount: number };

const LOG_KEEP = 30;

/**
 * Applies the provider's current state of a payment. Idempotent: the same id any number of times
 * has one effect. Returns what happened.
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
    // refunded in the provider's dashboard: more than our rows say (ours are written first)
    const outside = paidOrLater(from) ? truth.amountRefunded - refundedOf(payment) : 0;
    if (!movesForward(from, truth.status) && outside <= 0) {
      await payload.update({ collection: 'payments', id: payment.id, data: { log }, req });
      return false;
    }
    await payload.update({
      collection: 'payments',
      id: payment.id,
      data: {
        status: movesForward(from, truth.status) ? truth.status : from,
        paidAt: truth.paidAt?.toISOString() ?? payment.paidAt,
        raw: truth.raw as Payment['raw'],
        log,
        ...(outside > 0
          ? {
              refunds: [
                ...refundRows(payment),
                { amount: outside, at: now.toISOString(), note: 'a fizetési szolgáltató felületén' },
              ],
            }
          : {}),
      },
      req,
    });
    if (outside > 0) {
      // the order follows (a duplicate payment's refund leaves it as it is)
      if (order.status === 'paid' || order.status === 'partially_refunded') {
        const full = truth.amountRefunded >= truth.amount;
        await payload.update({
          collection: 'orders',
          id: order.id,
          data: { status: full ? 'refunded' : 'partially_refunded' },
          req,
        });
        effects.push({ type: 'refundedOutside', order, full, amount: outside });
      }
      return true;
    }
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
 * payment), only if a place is still free and the person hasn't signed up for it again.
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
        sameTarget(a),
        { status: { in: ['held', 'registered'] } },
        { id: { not_equals: a.id } },
      ],
    },
    req,
  });
  if (again.totalDocs) return false;
  return fits(req, a, a.id);
}

async function runEffect(payload: Payload, e: Effect) {
  switch (e.type) {
    case 'paid':
      return queueFollowUps(payload, e.orderId);
    case 'mismatch':
      return sendStaffAlert(payload, await applicationSettings(payload), 'eltérő fizetett összeg', [
        `A ${e.providerPaymentId} fizetés ${e.got} Ft-ról szól, a rendelés (#${e.orderId}) ${e.expected} Ft. A jelentkezést nem véglegesítettük.`,
        'Nézd meg a fizetést a szolgáltató felületén és a Rendelések között.',
      ]);
    case 'refundedOutside':
      return afterOrderRefund(payload, e.order, { full: e.full, amount: e.amount, where: 'dashboard' });
    case 'refund':
      return refundAutomatically(payload, e.orderId, e.paymentId, e.amount, e.why);
  }
}
