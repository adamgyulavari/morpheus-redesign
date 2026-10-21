/**
 * Money back. Every refund — ours (a late or a duplicate payment, staff's "Visszatérítés") or one
 * made in the provider's dashboard — is a row on the payment, so the provider's refunded total
 * minus our rows is what was refunded elsewhere. Ours are written before the provider is asked:
 * its answer (the webhook) can arrive first and must not take it for a dashboard refund.
 */
import type { Payload } from 'payload';

import { applicantOf, inTransaction } from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { formatHuf } from '@/lib/format';
import { stornoInvoice } from '@/lib/invoicing/service';
import { relId } from '@/payload/rel';
import type { Order, Payment } from '@/payload-types';

import { sendLateRefund, sendStaffAlert } from './notify';
import { lockOrder, type Result } from './orders';
import { paymentProvider } from './providers';
import { targetOf } from './target';
import { type ProviderStatus, paidOrLater } from './types';

type RefundRow = NonNullable<Payment['refunds']>[number];

/** The rows as Payload takes them back (relations as ids). */
export const refundRows = (p: Pick<Payment, 'refunds'>) => (p.refunds ?? []).map((r) => ({ ...r, by: relId(r.by) }));

/** What our rows say was refunded. */
export const refundedOf = (p: Pick<Payment, 'refunds'>) => (p.refunds ?? []).reduce((n, r) => n + (r.amount ?? 0), 0);

/**
 * Sends `amount` of a paid payment back through the provider and records it (`by`: the staff
 * member; `note`: why). Refuses more than what is left of it.
 */
export async function refundPayment(
  payload: Payload,
  paymentId: number,
  amount: number,
  note: string,
  by?: number,
): Promise<Result<{ left: number }>> {
  const provider = paymentProvider();
  const at = new Date().toISOString();
  const recorded = await inTransaction(payload, async (req) => {
    const first = await payload.findByID({ collection: 'payments', id: paymentId, depth: 0, req });
    await lockOrder(req, relId(first.order) ?? 0);
    const p = await payload.findByID({ collection: 'payments', id: paymentId, depth: 0, req });
    // paid through another provider (e.g. the mock while developing): not ours to send back
    if (p.provider !== provider.name) return { p, left: 0, ok: false as const };
    const left = p.amount - refundedOf(p);
    if (!paidOrLater(p.status as ProviderStatus) || amount < 1 || amount > left) return { p, left, ok: false as const };
    await payload.update({
      collection: 'payments',
      id: p.id,
      data: { refunds: [...refundRows(p), { amount, at, by, note }] },
      req,
    });
    return { p, left, ok: true as const };
  });
  if (!recorded.ok)
    return {
      ok: false,
      reason:
        recorded.left > 0 ? `Legfeljebb ${formatHuf(recorded.left)} téríthető vissza.` : 'Nincs mit visszatéríteni.',
    };

  const p = recorded.p;
  try {
    const n = (p.refunds ?? []).length + 1;
    const r = await provider.refund(p.providerPaymentId, amount, `Visszatérítés #${relId(p.order)}/${n}`);
    await setRow(payload, paymentId, at, (row) => ({ ...row, providerRefundId: r.providerRefundId }));
    return { ok: true, left: recorded.left - amount };
  } catch (err) {
    payload.logger.error({ err, msg: `refund failed for payment ${p.providerPaymentId}` });
    await setRow(payload, paymentId, at, () => null);
    return { ok: false, reason: 'A fizetési szolgáltató nem fogadta el a visszatérítést.' };
  }
}

/** Changes (or with null, removes) our row written at `at`. */
async function setRow(payload: Payload, paymentId: number, at: string, f: (r: RefundRow) => RefundRow | null) {
  const p = await payload.findByID({ collection: 'payments', id: paymentId, depth: 0 });
  const rows = refundRows(p).flatMap((r) => (r.at === at && !r.providerRefundId ? (f(r as RefundRow) ?? []) : [r]));
  await payload.update({ collection: 'payments', id: paymentId, data: { refunds: rows as Payment['refunds'] } });
}

/** The order after money went back: refunded in full, or in part. */
export async function markOrderRefunded(payload: Payload, orderId: number, full: boolean) {
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { status: full ? 'refunded' : 'partially_refunded' },
  });
}

/**
 * The invoice after a refund of a paid order (staff's, or in the provider's dashboard): in full it
 * is reversed (storno); in part, staff correct it by hand. The sign-up is left as it is — staff
 * decide. Staff are told either way.
 */
export async function afterOrderRefund(
  payload: Payload,
  order: Pick<Order, 'id' | 'label' | 'kind' | 'application'>,
  r: { full: boolean; amount: number; where: 'dashboard' | 'admin'; note?: string },
) {
  const settings = await applicationSettings(payload);
  // a show's tickets refunded in full: the seats are free again
  const freed = r.full && order.kind === 'show' && (await freeSeats(payload, relId(order.application)));
  if (r.full) {
    const { docs } = await payload.find({
      collection: 'invoices',
      where: { and: [{ order: { equals: order.id } }, { kind: { equals: 'invoice' } }] },
      depth: 0,
    });
    for (const invoice of docs) await stornoInvoice(payload, invoice.id, 'Visszatérítés');
  }
  await sendStaffAlert(payload, settings, r.full ? 'visszatérítés' : 'részleges visszatérítés', [
    r.where === 'dashboard'
      ? `A rendelés #${order.id} (${order.label}) fizetéséből ${formatHuf(r.amount)}-ot visszautaltatok a fizetési szolgáltató felületén.`
      : `A rendelés #${order.id} (${order.label}) fizetéséből ${formatHuf(r.amount)}-ot visszatérítettetek az adminban${r.note ? ` (${r.note})` : ''}.`,
    r.full ? 'A számlát sztornóztuk (Pénzügyek → Számlák).' : 'A számlát kézzel kell helyesbíteni a Számlázz.hu-ban.',
    freed
      ? 'A jegyfoglalást lemondtuk, a helyek felszabadultak.'
      : 'A jelentkezés nem változott: ha kell, mondd le a Jelentkezések oldalon.',
  ]);
}

/** A refunded show booking: cancelled (no e-mail — the refund is what they hear about). */
async function freeSeats(payload: Payload, applicationId: number | null): Promise<boolean> {
  if (!applicationId) return false;
  const a = await payload.findByID({ collection: 'applications', id: applicationId, depth: 0, disableErrors: true });
  if (a?.kind !== 'show' || a.status !== 'registered') return false;
  await payload.update({
    collection: 'applications',
    id: a.id,
    data: { status: 'cancelled', cancelReason: 'Visszatérítve.' },
  });
  return true;
}

/** A late or duplicate payment goes back in full; the person (late) and staff are told. */
export async function refundAutomatically(
  payload: Payload,
  orderId: number,
  paymentId: number,
  amount: number,
  why: 'late' | 'duplicate',
) {
  const settings = await applicationSettings(payload);
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1 });
  const done = await refundPayment(
    payload,
    paymentId,
    amount,
    why === 'late' ? 'késve érkezett, a hely betelt' : 'kétszer fizetve',
  );
  if (!done.ok) {
    await sendStaffAlert(payload, settings, 'az automatikus visszatérítés nem sikerült', [
      `A rendelés #${orderId} egyik fizetését (${formatHuf(amount)}) vissza kellett volna utalni, de nem sikerült: ${done.reason} Kérjük, intézd kézzel.`,
    ]);
    return;
  }
  // a duplicate: the order stays paid by its other payment
  if (why === 'late') await markOrderRefunded(payload, orderId, true);
  const application = typeof order.application === 'object' ? order.application : null;
  if (why === 'late' && application)
    await sendLateRefund(
      payload,
      applicantOf(application),
      (await targetOf(payload, application, new Date())).info,
      amount,
    );
  await sendStaffAlert(payload, settings, 'automatikus visszatérítés', [
    why === 'late'
      ? `A rendelés #${orderId} (${order.label}) fizetése a foglalási idő lejárta után érkezett, és a hely már betelt: ${formatHuf(amount)}-ot automatikusan visszautaltunk, a jelentkezőt értesítettük.`
      : `A rendelés #${orderId} (${order.label}) kétszer lett kifizetve: a második fizetést (${formatHuf(amount)}) automatikusan visszautaltuk.`,
  ]);
}

/**
 * Staff's "Visszatérítés" on an order (admin): from its paid payment, all that is left by default.
 * The order becomes (partially) refunded; then the invoice (afterOrderRefund).
 */
export async function refundOrder(
  payload: Payload,
  orderId: number,
  input: { amount?: number; note: string },
  by: number,
): Promise<Result<{ full: boolean; amount: number }>> {
  const note = input.note.trim();
  if (!note) return { ok: false, reason: 'Írd be a visszatérítés okát.' };
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, disableErrors: true });
  if (!order || (order.status !== 'paid' && order.status !== 'partially_refunded'))
    return { ok: false, reason: 'Csak kifizetett rendelés téríthető vissza.' };
  const payment = (await refundable(payload, orderId))[0];
  if (!payment) return { ok: false, reason: 'Nincs visszatéríthető fizetés.' };
  const amount = Math.round(input.amount ?? payment.left);
  const done = await refundPayment(payload, payment.id, amount, note, by);
  if (!done.ok) return done;
  const full = done.left === 0;
  await markOrderRefunded(payload, orderId, full);
  await afterOrderRefund(payload, order, { full, amount, where: 'admin', note });
  return { ok: true, full, amount };
}

/** The order's paid payments, with what is left of each to refund. */
export async function refundable(payload: Payload, orderId: number) {
  const { docs } = await payload.find({
    collection: 'payments',
    where: { and: [{ order: { equals: orderId } }, { status: { in: ['paid', 'partially_refunded'] } }] },
    sort: '-paidAt',
    depth: 0,
  });
  return docs.map((p) => ({ id: p.id, amount: p.amount, left: p.amount - refundedOf(p) })).filter((p) => p.left > 0);
}
