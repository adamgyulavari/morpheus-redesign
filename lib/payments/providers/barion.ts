/**
 * Barion (Smart Gateway) — ALL Barion-specific code lives here: the REST calls, the status mapping,
 * the callback format. `BARION_API_KEY`: the shop's secret POSKey; `BARION_PAYEE`: the e-mail of
 * the Barion wallet the money goes to; `BARION_ENV`: `test` (default, api.test.barion.com) | `live`.
 */
import { createHash, randomUUID } from 'node:crypto';

import type { PaymentProvider, ProviderStatus } from '../types';

const live = () => process.env.BARION_ENV === 'live';
const api = () => (live() ? 'https://api.barion.com' : 'https://api.test.barion.com');
const gateway = () => (live() ? 'https://secure.barion.com/Pay' : 'https://secure.test.barion.com/Pay');

function env(name: 'BARION_API_KEY' | 'BARION_PAYEE') {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

type BarionError = { ErrorCode?: string; Title?: string; Description?: string };

/** One call to Barion's API: the POSKey goes in the header, errors come back as `Errors: […]`. */
async function call<T>(method: 'GET' | 'POST', path: string, body?: object, idempotencyKey?: string): Promise<T> {
  const res = await fetch(`${api()}${path}`, {
    method,
    headers: {
      'x-pos-key': env('BARION_API_KEY'),
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T & { Errors?: BarionError[] };
  const errors = json.Errors ?? [];
  if (!res.ok || errors.length > 0) {
    const what = errors.map((e) => `${e.ErrorCode}: ${e.Title ?? e.Description}`).join('; ');
    throw new Error(`Barion ${path} → ${res.status} ${what}`);
  }
  return json;
}

type Transaction = {
  TransactionId: string;
  POSTransactionId: string | null;
  TransactionType: string;
  Status: string;
  Total: number;
  Currency: string;
  RelatedId: string | null;
};
type PaymentState = {
  PaymentId: string;
  Status: string;
  Currency: string;
  CompletedAt: string | null;
  FundingSource: string | null;
  Transactions: Transaction[];
};

/** Barion's own payment ids: 32 hex digits, sometimes written as a dashed GUID. */
const PAYMENT_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/**
 * Barion's payment status (plus what was refunded) → ours. `Prepared`/`Started`: not paid yet (the
 * person may still be on Barion's page, retrying a card); `InProgress`/`Waiting`/`Reserved`/
 * `Authorized`: being processed; `PartiallySucceeded`: our one transaction is the part that did.
 */
export function mapBarionStatus(status: string, amount: number, amountRefunded: number): ProviderStatus {
  switch (status) {
    case 'Succeeded':
    case 'PartiallySucceeded':
      if (amountRefunded > 0) return amountRefunded >= amount ? 'refunded' : 'partially_refunded';
      return 'paid';
    case 'Failed':
      return 'failed';
    case 'Expired':
      return 'expired';
    case 'Canceled':
      return 'canceled';
    case 'Prepared':
    case 'Started':
      return 'open';
    default:
      // InProgress, Waiting, Reserved, Authorized
      return 'pending';
  }
}

/** Our shop transaction in a payment (the fees and refunds are transactions too). */
const shopTransaction = (p: PaymentState) => p.Transactions.find((t) => t.POSTransactionId);

const REFUND_TYPES = ['Refund', 'RefundToBankCard', 'RefundToBankAccount'];

/** What was paid and refunded, in whole forints (anything else than HUF is refused). */
export function barionAmounts(p: PaymentState): { amount: number; amountRefunded: number } {
  if (p.Currency !== 'HUF') throw new Error(`unexpected currency ${p.Currency}`);
  const shop = shopTransaction(p);
  if (!shop) throw new Error(`Barion payment ${p.PaymentId} has no shop transaction`);
  const refunded = p.Transactions.filter(
    (t) => t.RelatedId === shop.TransactionId && REFUND_TYPES.includes(t.TransactionType) && t.Status === 'Succeeded',
  ).reduce((sum, t) => sum + t.Total, 0);
  return { amount: Math.round(shop.Total), amountRefunded: Math.round(refunded) };
}

const getState = (id: string) => call<PaymentState>('GET', `/v4/Payment/${id}/PaymentState`);

const isLocal = (url: string) => ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname);

export const barionProvider: PaymentProvider = {
  name: 'barion',
  brand: { name: 'Barion' },
  async createPayment(i) {
    // a new id for every attempt: paying an order again starts a new Barion payment
    const requestId = `${i.orderId}-${randomUUID().slice(0, 8)}`;
    const p = await call<{ PaymentId: string; GatewayUrl?: string }>('POST', '/v2/Payment/Start', {
      POSKey: env('BARION_API_KEY'),
      PaymentType: 'Immediate',
      FundingSources: ['All'],
      PaymentRequestId: requestId,
      OrderNumber: i.orderId,
      PayerHint: i.customerEmail,
      Locale: 'hu-HU',
      Currency: 'HUF',
      RedirectUrl: i.returnUrl,
      // Barion can't reach a local server; there the order page asks Barion instead
      ...(isLocal(i.webhookUrl) ? {} : { CallbackUrl: i.webhookUrl }),
      Transactions: [
        {
          POSTransactionId: requestId,
          Payee: env('BARION_PAYEE'),
          Total: i.amount,
          Comment: i.description,
          Items: [
            {
              Name: i.description,
              Description: i.description,
              Quantity: 1,
              Unit: 'db',
              UnitPrice: i.amount,
              ItemTotal: i.amount,
              SKU: `order-${i.orderId}`,
            },
          ],
        },
      ],
    });
    return {
      providerPaymentId: p.PaymentId,
      checkoutUrl: p.GatewayUrl ?? `${gateway()}?${new URLSearchParams({ id: p.PaymentId })}`,
    };
  },
  async getPayment(id) {
    const p = await getState(id);
    const { amount, amountRefunded } = barionAmounts(p);
    const status = mapBarionStatus(p.Status, amount, amountRefunded);
    return {
      status,
      amount,
      amountRefunded,
      paidAt: p.CompletedAt && status !== 'open' && status !== 'pending' ? new Date(p.CompletedAt) : undefined,
      raw: { id: p.PaymentId, status: p.Status, fundingSource: p.FundingSource, amount, amountRefunded },
    };
  },
  async refund(id, amount, description) {
    // a refund names the transaction it pays back, so the payment is looked up first
    const shop = shopTransaction(await getState(id));
    if (!shop?.POSTransactionId) throw new Error(`Barion payment ${id} has no shop transaction`);
    const r = await call<{ RefundedTransactions: { TransactionId: string; Total: number; Status: string }[] }>(
      'POST',
      '/v2/Payment/Refund',
      {
        POSKey: env('BARION_API_KEY'),
        PaymentId: id,
        TransactionsToRefund: [
          {
            TransactionId: shop.TransactionId,
            POSTransactionId: shop.POSTransactionId,
            AmountToRefund: amount,
            Comment: description,
          },
        ],
      },
      // the same refund retried (e.g. after a network error) is not made twice; the description
      // carries our own reference, so two different refunds of one payment get different keys
      createHash('sha256').update(`${id}|${amount}|${description}`).digest('hex').slice(0, 40),
    );
    const t = r.RefundedTransactions[0];
    if (!t) throw new Error('Barion returned no refund transaction');
    return { providerRefundId: t.TransactionId, raw: { id: t.TransactionId, status: t.Status, amount: t.Total } };
  },
  async parseWebhook(req) {
    // Barion POSTs `paymentId=…`, form-encoded, and also puts it on the callback URL's query
    const fromQuery = new URL(req.url).searchParams.get('paymentId');
    const id = fromQuery ?? new URLSearchParams(await req.text()).get('paymentId');
    return id && PAYMENT_ID.test(id) ? { providerPaymentId: id } : null;
  },
};
