/**
 * Provider-agnostic payment types. Everything outside `providers/` uses only these: no vendor SDK,
 * field name, status or id format leaks past this file. Amounts are whole forints (HUF) everywhere.
 */

/**
 * A payment's state as our code understands it (each provider maps its own statuses to these):
 * `open` — the person hasn't paid (yet); `pending` — a payment is being processed.
 */
export type ProviderStatus =
  | 'open'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded';

export type ProviderPayment = {
  status: ProviderStatus;
  /** HUF */
  amount: number;
  /** HUF, refunded so far */
  amountRefunded: number;
  paidAt?: Date;
  /** The provider's own answer, stored for support (never read by our logic). */
  raw: unknown;
};

export interface PaymentProvider {
  /** Stored on each payment (e.g. "mock"). */
  name: string;
  createPayment(i: {
    orderId: string;
    /** HUF */
    amount: number;
    description: string;
    customerEmail: string;
    returnUrl: string;
    webhookUrl: string;
  }): Promise<{ providerPaymentId: string; checkoutUrl: string }>;
  /** The truth about a payment — always asked from the provider, never taken from a callback's body. */
  getPayment(providerPaymentId: string): Promise<ProviderPayment>;
  /** HUF */
  refund(
    providerPaymentId: string,
    amount: number,
    description: string,
  ): Promise<{ providerRefundId: string; raw: unknown }>;
  /** The payment id from a callback request (null: not ours / malformed). Never trusts a status in it. */
  parseWebhook(req: Request): Promise<{ providerPaymentId: string } | null>;
}

/** Statuses only move forward: a late or repeated callback can't take a payment back. */
const RANK: Record<ProviderStatus, number> = {
  open: 0,
  pending: 1,
  failed: 2,
  expired: 2,
  canceled: 2,
  paid: 3,
  partially_refunded: 4,
  refunded: 5,
};

export const movesForward = (from: ProviderStatus, to: ProviderStatus) => RANK[to] > RANK[from];

/** Paid, or refunded after having been paid. */
export const paidOrLater = (s: ProviderStatus) => RANK[s] >= RANK.paid;
