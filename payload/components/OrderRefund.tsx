import type { UIFieldServerProps } from 'payload';

import { formatHuf } from '@/lib/format';
import { refundable } from '@/lib/payments/refunds';
import { userIsAdmin } from '@/payload/access';

import { OrderRefundForm } from './OrderRefundForm';

/**
 * On a paid order (admin): "Visszatérítés" — through the payment provider, all that is left by
 * default. Admins only. Refunds made in the provider's dashboard show up here by themselves.
 */
export async function OrderRefund({ id, payload, req }: UIFieldServerProps) {
  if (!id || !userIsAdmin(req.user)) return null;
  const order = await payload.findByID({ collection: 'orders', id, depth: 0, disableErrors: true });
  if (!order || (order.status !== 'paid' && order.status !== 'partially_refunded')) return null;
  const payment = (await refundable(payload, order.id))[0];
  if (!payment) return null;
  return (
    <OrderRefundForm
      orderId={order.id}
      left={payment.left}
      leftText={formatHuf(payment.left)}
      paidText={formatHuf(payment.amount)}
    />
  );
}
