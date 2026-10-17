'use server';

/**
 * The checkout page (/fizetes) and the result page (/fizetes/eredmeny). Prices and credit come
 * only from the server; bots get a honeypot and rate limits (per IP and per address).
 */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getCurrentUser, payloadClient } from '@/lib/auth';
import { allow, clientIp } from '@/payload/magic-link';

import { cancelOrder, checkout, orderStatus, resultUrl, retryPayment, sessionByCode } from './service';

export type CheckoutState = { error?: string; values?: Record<string, string> };

const MAX_PER_IP = 10;
const MAX_PER_EMAIL = 5;

const str = (form: FormData, name: string) => String(form.get(name) ?? '').trim();
const FIELDS = [
  'lastName',
  'firstName',
  'email',
  'phone',
  'billingName',
  'zip',
  'city',
  'address',
  'country',
  'taxNumber',
] as const;

export async function checkoutAction(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries(FIELDS.map((f) => [f, str(form, f)])) as Record<(typeof FIELDS)[number], string>;
  values.email = values.email.toLowerCase();
  // honeypot: people don't see it; bots fill it in and get nowhere
  if (str(form, 'website')) return { error: 'Hibás kérés.', values };
  if (form.get('terms') !== 'on')
    return { error: 'A jelentkezéshez el kell fogadnod az ÁSZF-et és a lemondási feltételeket.', values };

  const viewer = await getCurrentUser();
  const ip = clientIp(await headers());
  const email = viewer?.email ?? values.email;
  if (!allow(`checkout-ip:${ip}`, MAX_PER_IP) || (email && !allow(`checkout-email:${email}`, MAX_PER_EMAIL)))
    return { error: 'Túl sok próbálkozás rövid időn belül. Próbáld újra negyedóra múlva.', values };

  const payload = await payloadClient();
  const session = await sessionByCode(payload, str(form, 'alkalom'));
  if (!session) return { error: 'Nincs ilyen alkalom.', values };
  const r = await checkout(payload, viewer, {
    sessionId: session.id,
    lastName: values.lastName,
    firstName: values.firstName,
    email: values.email,
    phone: values.phone,
    billing: {
      name: values.billingName,
      zip: values.zip,
      city: values.city,
      address: values.address,
      country: values.country,
      taxNumber: values.taxNumber,
    },
  });
  if (!r.ok) return { error: r.reason, values };
  redirect(r.checkoutUrl ?? resultUrl(r.token));
}

/** The result page's poll: the order's state (refreshed from the provider while pending). */
export async function orderStatusAction(token: string) {
  return orderStatus(await payloadClient(), token);
}

/** "Újrapróbálom": a new payment for the same order. */
export async function retryPaymentAction(token: string): Promise<{ error?: string }> {
  const r = await retryPayment(await payloadClient(), token);
  if (!r.ok) return { error: r.reason };
  redirect(r.checkoutUrl ?? resultUrl(r.token));
}

/** "Mégse": the place is let go. */
export async function cancelOrderAction(token: string): Promise<{ error?: string; done?: boolean }> {
  const r = await cancelOrder(await payloadClient(), token);
  return r.ok ? { done: true } : { error: r.reason };
}
