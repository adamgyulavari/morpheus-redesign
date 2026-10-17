/**
 * Mollie — ALL Mollie-specific code lives here: the SDK, the amount format, the status mapping,
 * the webhook format. `MOLLIE_API_KEY`: a `test_` key is test mode, a `live_` key real payments.
 */
import { createHash } from 'node:crypto';

import { createMollieClient, Locale, type Payment, PaymentStatus } from '@mollie/api-client';

import type { PaymentProvider, ProviderStatus } from '../types';

let client: ReturnType<typeof createMollieClient> | null = null;
function mollie() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) throw new Error('MOLLIE_API_KEY is not set');
  client ??= createMollieClient({ apiKey });
  return client;
}

/** Whole forints → Mollie's amount: { currency: 'HUF', value: '12000.00' }. */
export const toMollieAmount = (huf: number) => ({ currency: 'HUF', value: `${Math.round(huf)}.00` });

/** Mollie's amount → whole forints (anything else than HUF is refused). */
export function fromMollieAmount(a: { currency: string; value: string } | null | undefined): number {
  if (!a) return 0;
  if (a.currency !== 'HUF') throw new Error(`unexpected currency ${a.currency}`);
  return Math.round(Number(a.value));
}

/**
 * Mollie's payment status (plus what was refunded) → ours. `open`: not paid yet (also after a
 * failed card, which Mollie lets the person retry, or leaving its page); `pending`/`authorized`:
 * being processed; a paid payment with refunds is (partially) refunded.
 */
export function mapMollieStatus(status: string, amount: number, amountRefunded: number): ProviderStatus {
  switch (status) {
    case PaymentStatus.paid:
      if (amountRefunded > 0) return amountRefunded >= amount ? 'refunded' : 'partially_refunded';
      return 'paid';
    case PaymentStatus.failed:
      return 'failed';
    case PaymentStatus.expired:
      return 'expired';
    case PaymentStatus.canceled:
      return 'canceled';
    case PaymentStatus.open:
      return 'open';
    default:
      // pending, authorized
      return 'pending';
  }
}

const describe = (p: Payment) => {
  const amount = fromMollieAmount(p.amount);
  const amountRefunded = fromMollieAmount(p.amountRefunded);
  return {
    status: mapMollieStatus(p.status, amount, amountRefunded),
    amount,
    amountRefunded,
    paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
    raw: {
      id: p.id,
      status: p.status,
      amount: p.amount,
      amountRefunded: p.amountRefunded,
      method: p.method,
      mode: p.mode,
    },
  };
};

const isLocal = (url: string) => ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname);

export const mollieProvider: PaymentProvider = {
  name: 'mollie',
  // Mollie's own wordmark (from its checkout page)
  brand: { name: 'Mollie', logo: '/payments/mollie.svg' },
  async createPayment(i) {
    const p = await mollie().payments.create({
      amount: toMollieAmount(i.amount),
      description: i.description,
      redirectUrl: i.returnUrl,
      // Mollie refuses a webhook it can't reach; locally the order page asks Mollie instead
      ...(isLocal(i.webhookUrl) ? {} : { webhookUrl: i.webhookUrl }),
      metadata: { orderId: i.orderId, email: i.customerEmail },
      locale: Locale.hu_HU,
    });
    const checkoutUrl = p.getCheckoutUrl();
    if (!checkoutUrl) throw new Error('Mollie returned no checkout URL');
    return { providerPaymentId: p.id, checkoutUrl };
  },
  async getPayment(id) {
    return describe(await mollie().payments.get(id));
  },
  async refund(id, amount, description) {
    const r = await mollie().paymentRefunds.create({
      paymentId: id,
      amount: toMollieAmount(amount),
      description,
      // the same refund retried (e.g. after a network error) is not made twice; the description
      // carries our own reference, so two different refunds of one payment get different keys
      idempotencyKey: createHash('sha256').update(`${id}|${amount}|${description}`).digest('hex').slice(0, 40),
    });
    return { providerRefundId: r.id, raw: { id: r.id, status: r.status, amount: r.amount } };
  },
  async parseWebhook(req) {
    // Mollie POSTs application/x-www-form-urlencoded with only `id=tr_…`
    const body = await req.text();
    const id = new URLSearchParams(body).get('id');
    return id && /^tr_[A-Za-z0-9]+$/.test(id) ? { providerPaymentId: id } : null;
  },
};
