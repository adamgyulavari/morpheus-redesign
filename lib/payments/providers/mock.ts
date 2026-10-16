/**
 * A fake provider for development and tests: the "checkout" is our own page (/fizetes/mock/…) with
 * Fizetés / Sikertelen / Mégse buttons; its state is kept in the hidden `mockPayments` collection.
 * Never available on a deployed site (providers/index.ts).
 */
import type { PaymentProvider, ProviderStatus } from '../types';

const ID = /^mock_(\d+)$/;

async function db() {
  const [{ getPayload }, { default: config }] = await Promise.all([import('payload'), import('@payload-config')]);
  return getPayload({ config });
}
const docId = (providerPaymentId: string) => {
  const m = ID.exec(providerPaymentId);
  if (!m) throw new Error(`not a mock payment id: ${providerPaymentId}`);
  return Number(m[1]);
};

export const mockProvider: PaymentProvider = {
  name: 'mock',
  async createPayment(i) {
    const payload = await db();
    const doc = await payload.create({
      collection: 'mockPayments',
      data: {
        orderId: i.orderId,
        amount: i.amount,
        description: i.description,
        status: 'pending',
        returnUrl: i.returnUrl,
        webhookUrl: i.webhookUrl,
      },
    });
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
    return { providerPaymentId: `mock_${doc.id}`, checkoutUrl: `${base}/fizetes/mock/mock_${doc.id}` };
  },
  async getPayment(id) {
    const payload = await db();
    const p = await payload.findByID({ collection: 'mockPayments', id: docId(id) });
    const refunded = p.amountRefunded ?? 0;
    const status: ProviderStatus =
      p.status === 'paid' && refunded > 0
        ? refunded >= p.amount
          ? 'refunded'
          : 'partially_refunded'
        : p.status === 'pending'
          ? 'open' // the mock page's buttons not pressed yet
          : p.status;
    return {
      status,
      amount: p.amount,
      amountRefunded: refunded,
      paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
      raw: { id, status: p.status, amount: p.amount, amountRefunded: refunded },
    };
  },
  async refund(id, amount) {
    const payload = await db();
    const p = await payload.findByID({ collection: 'mockPayments', id: docId(id) });
    if (p.status !== 'paid') throw new Error('only a paid payment can be refunded');
    if ((p.amountRefunded ?? 0) + amount > p.amount) throw new Error('refund exceeds the payment');
    await payload.update({
      collection: 'mockPayments',
      id: p.id,
      data: { amountRefunded: (p.amountRefunded ?? 0) + amount },
    });
    const providerRefundId = `mockrefund_${p.id}_${Date.now()}`;
    return { providerRefundId, raw: { id: providerRefundId, amount } };
  },
  async parseWebhook(req) {
    const id = new URLSearchParams(await req.text()).get('id');
    return id && ID.test(id) ? { providerPaymentId: id } : null;
  },
};
