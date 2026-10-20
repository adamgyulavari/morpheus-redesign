'use server';

/**
 * The checkout page (/fizetes) and the result page (/fizetes/eredmeny). Prices and credit come
 * only from the server; bots get a honeypot and rate limits (per IP and per address).
 */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { showByCode } from '@/lib/applications/shows';
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { allow, clientIp } from '@/payload/magic-link';
import { checkout, checkoutCourse, checkoutShow, retryPayment } from './checkout';
import { cancelOrder, orderStatus } from './order-page';
import { resultUrl } from './orders';

import { groupByCode, sessionByCode } from './target';

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

/** What both checkouts share: the fields, the honeypot, the terms, the rate limits. */
async function readCheckout(form: FormData) {
  const values = Object.fromEntries(FIELDS.map((f) => [f, str(form, f)])) as Record<(typeof FIELDS)[number], string>;
  values.email = values.email.toLowerCase();
  // honeypot: people don't see it; bots fill it in and get nowhere
  if (str(form, 'website')) return { values, error: 'Hibás kérés.' };
  if (form.get('terms') !== 'on')
    return { values, error: 'A jelentkezéshez el kell fogadnod az ÁSZF-et és a lemondási feltételeket.' };
  const viewer = await getCurrentUser();
  const ip = clientIp(await headers());
  const email = viewer?.email ?? values.email;
  if (!allow(`checkout-ip:${ip}`, MAX_PER_IP) || (email && !allow(`checkout-email:${email}`, MAX_PER_EMAIL)))
    return { values, error: 'Túl sok próbálkozás rövid időn belül. Próbáld újra negyedóra múlva.' };
  const input = {
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
  };
  return { values, viewer, input, payload: await payloadClient() };
}

/** A Nyitott Műhely date (`alkalom`: its public code). */
export async function checkoutAction(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const c = await readCheckout(form);
  if (!c.input) return { error: c.error, values: c.values };
  const session = await sessionByCode(c.payload, str(form, 'alkalom'));
  if (!session) return { error: 'Nincs ilyen alkalom.', values: c.values };
  const r = await checkout(c.payload, c.viewer, { ...c.input, sessionId: session.id });
  if (!r.ok) return { error: r.reason, values: c.values };
  redirect(r.checkoutUrl ?? resultUrl(r.token));
}

/** A kezdő group (`csoport`: its public code; `opcio`: its payment option). */
export async function courseCheckoutAction(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const c = await readCheckout(form);
  const values = { ...c.values, opcio: str(form, 'opcio') };
  if (!c.input) return { error: c.error, values };
  const group = await groupByCode(c.payload, str(form, 'csoport'));
  if (!group) return { error: 'Nincs ilyen csoport.', values };
  const r = await checkoutCourse(c.payload, c.viewer, { ...c.input, groupId: group.id, optionId: str(form, 'opcio') });
  if (!r.ok) return { error: r.reason, values };
  redirect(r.checkoutUrl ?? resultUrl(r.token));
}

/** Tickets for a show (`eloadas`: its public code; `jegyek`: how many). */
export async function showCheckoutAction(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const c = await readCheckout(form);
  const values = { ...c.values, jegyek: str(form, 'jegyek') };
  if (!c.input) return { error: c.error, values };
  const show = await showByCode(c.payload, str(form, 'eloadas'));
  if (!show) return { error: 'Nincs ilyen előadás.', values };
  const r = await checkoutShow(c.payload, c.viewer, { ...c.input, showId: show.id, seats: Number(values.jegyek) || 0 });
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
