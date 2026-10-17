/**
 * The ONLY place that picks the payment provider: env `PAYMENT_PROVIDER` = `mollie` | `mock`.
 * To switch to Barion: add providers/barion.ts and one line below (see README.md).
 */
import type { PaymentProvider } from '../types';
import { mockProvider } from './mock';
import { mollieProvider } from './mollie';

/** The mock runs in development and on a local production build, never on a deployed site. */
export function mockAllowed(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const host = new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost').hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

const providerName = () => process.env.PAYMENT_PROVIDER ?? (process.env.NODE_ENV === 'production' ? '' : 'mock');

/** The mock's own pages and buttons work only while it is the provider in use (and allowed). */
export const mockActive = () => providerName() === 'mock' && mockAllowed();

export function paymentProvider(): PaymentProvider {
  const name = providerName();
  if (name === 'mollie') return mollieProvider;
  if (name === 'mock') {
    if (!mockAllowed()) throw new Error('The mock payment provider is not available in production.');
    return mockProvider;
  }
  throw new Error(`PAYMENT_PROVIDER: unknown provider "${name}"`);
}
