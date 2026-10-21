'use server';

/**
 * Server Actions of the account pages (/belepes, /regisztracio, /elfelejtett-jelszo,
 * /jelszo-visszaallitas, /fiokom). They call the Payload Local API with the visitor's rights
 * (`overrideAccess: false`) wherever a user is involved, and set the same session cookie as the admin.
 */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createLocalReq, logoutOperation } from 'payload';

import { allow, clientIp, consumeLoginCode, consumeMagicLink, requestMagicLink } from '@/payload/magic-link';
import { issueSession } from '@/payload/session';
import { uiTexts } from '@/payload/ui-texts';

import { clearSessionCookies, getCurrentUser, payloadClient, safeReturnPath, setSessionCookies } from './auth';
import { fill } from './format';
import { clean, validateBilling } from './payments/billing';

export type FormState = { error?: string; message?: string; done?: boolean; values?: Record<string, string> };

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const MIN_PASSWORD = 8;
/** The answers' words (Felületi szövegek → Üzenetek → Fiók). */
const texts = async () => (await uiTexts(await payloadClient())).accountErrors;

// ── login ───────────────────────────────────────────────────────────────────

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, 'email').toLowerCase();
  const password = String(form.get('password') ?? '');
  const values = { email };
  const t = await texts();
  if (!email || !password) return { error: t.missingLogin, values };

  const payload = await payloadClient();
  try {
    const { token, exp, user } = await payload.login({ collection: 'users', data: { email, password } });
    if (!token || !exp) return { error: t.failed, values };
    await setSessionCookies(token, new Date(exp * 1000), user);
  } catch (err) {
    // Payload's error classes don't survive bundling for `instanceof`; their HTTP status does:
    // 403 = e-mail not verified, 401 = wrong credentials or a locked account
    const status = (err as { status?: number }).status;
    if (status === 403) return { error: t.unverified, values };
    if (status === 401) {
      const user = await payload.db.findOne<{ id: number; lockUntil?: string | null }>({
        collection: 'users',
        where: { email: { equals: email } },
      });
      if (user?.lockUntil && new Date(user.lockUntil) > new Date()) return { error: t.locked, values };
      return { error: t.wrongLogin, values };
    }
    payload.logger.error({ err, msg: 'site login failed' });
    return { error: t.failed, values };
  }
  redirect(safeReturnPath(form.get('vissza')));
}

export async function sendMagicLink(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, 'email');
  const t = await texts();
  if (!email) return { error: t.missingEmail, values: { email } };
  const result = await requestMagicLink(await payloadClient(), email, clientIp(await headers()));
  if (result === 'rate-limited') return { error: t.tooMany, values: { email } };
  return { done: true, message: t.linkSent, values: { email } };
}

/** The "Belépés" button on /belepes/link: only this POST uses up the link (not opening it). */
export async function confirmMagicLink(_: FormState, form: FormData): Promise<FormState> {
  const payload = await payloadClient();
  const userId = await consumeMagicLink(payload, str(form, 'token'));
  if (!userId) redirect('/belepes?hiba=link');
  const { token, expires, user } = await issueSession(payload, userId);
  await setSessionCookies(token, expires, user);
  redirect(safeReturnPath(form.get('next')));
}

/** The 6-digit code from the login-link e-mail, typed on another device. */
export async function loginWithCode(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, 'email');
  const t = await texts();
  if (!allow(`code:${clientIp(await headers())}`, 20)) return { error: t.tooMany, values: { email } };
  const payload = await payloadClient();
  const userId = await consumeLoginCode(payload, email, str(form, 'code'));
  if (!userId) return { error: t.badCode, values: { email } };
  const { token, expires, user } = await issueSession(payload, userId);
  await setSessionCookies(token, expires, user);
  redirect(safeReturnPath(form.get('vissza')));
}

export async function logout(): Promise<void> {
  const payload = await payloadClient();
  const user = await getCurrentUser();
  if (user) {
    try {
      // ends this session on the server too (not just the cookie)
      await logoutOperation({ collection: payload.collections.users, req: await createLocalReq({ user }, payload) });
    } catch (err) {
      payload.logger.error({ err, msg: 'site logout failed' });
    }
  }
  await clearSessionCookies();
  redirect('/');
}

// ── registration & e-mail verification ─────────────────────────────────────

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const values = {
    lastName: str(form, 'lastName'),
    firstName: str(form, 'firstName'),
    email: str(form, 'email').toLowerCase(),
    phone: str(form, 'phone'),
  };
  const password = String(form.get('password') ?? '');
  const t = await texts();
  const sent: FormState = { done: true, message: t.registered };

  // honeypot: people don't see this field, bots fill it in — they get the same answer, nothing happens
  if (str(form, 'website')) return sent;
  if (!values.lastName || !values.firstName || !values.email) return { error: t.required, values };
  if (password.length < MIN_PASSWORD) return { error: fill(t.passwordShort, { min: MIN_PASSWORD }), values };
  if (form.get('privacy') !== 'on') return { error: t.privacy, values };
  if (!allow(`register:${clientIp(await headers())}`, 5)) return { error: t.tooMany, values };

  const payload = await payloadClient();
  try {
    await payload.create({
      collection: 'users',
      overrideAccess: false,
      data: { ...values, phone: values.phone || undefined, password, roles: ['guest'] },
    });
  } catch (err) {
    const fields = (err as { data?: { errors?: { path?: string }[] } }).data?.errors ?? [];
    if (fields.some((e) => e.path === 'email')) return { error: t.emailTaken, values };
    payload.logger.error({ err, msg: 'registration failed' });
    return { error: t.failed, values };
  }
  return sent;
}

// ── password reset ──────────────────────────────────────────────────────────

export async function forgotPassword(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, 'email').toLowerCase();
  const t = await texts();
  if (!email) return { error: t.missingEmail, values: { email } };
  if (!allow(`forgot:${clientIp(await headers())}`, 10) || !allow(`forgot:${email}`, 3))
    return { error: t.tooMany, values: { email } };
  const payload = await payloadClient();
  try {
    // Payload does nothing (and says nothing) for unknown addresses
    await payload.forgotPassword({ collection: 'users', data: { email } });
  } catch (err) {
    payload.logger.error({ err, msg: 'forgot password failed' });
  }
  return { done: true, message: t.resetSent };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const token = str(form, 'token');
  const password = String(form.get('password') ?? '');
  const t = await texts();
  if (password.length < MIN_PASSWORD) return { error: fill(t.passwordShort, { min: MIN_PASSWORD }) };
  if (password !== String(form.get('confirm') ?? '')) return { error: t.mismatch };

  const payload = await payloadClient();
  try {
    const { token: session, user } = await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
    });
    if (session)
      await setSessionCookies(
        session,
        new Date(Date.now() + payload.collections.users.config.auth.tokenExpiration * 1000),
        user,
      );
  } catch {
    return { error: t.resetInvalid };
  }
  redirect('/fiokom');
}

// ── account ─────────────────────────────────────────────────────────────────

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/belepes?vissza=/fiokom');
  const values = { lastName: str(form, 'lastName'), firstName: str(form, 'firstName'), phone: str(form, 'phone') };
  const t = await texts();
  if (!values.lastName || !values.firstName) return { error: t.nameEmpty, values };
  const payload = await payloadClient();
  try {
    await payload.update({ collection: 'users', id: user.id, data: values, overrideAccess: false, user });
  } catch (err) {
    payload.logger.error({ err, msg: 'profile update failed' });
    return { error: t.saveFailed, values };
  }
  return { message: t.saved, values };
}

/** Own billing details (prefilled at checkout; the invoice shows them). */
export async function updateBilling(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/belepes?vissza=/fiokom/adatok');
  const values = {
    name: str(form, 'billingName'),
    zip: str(form, 'zip'),
    city: str(form, 'city'),
    address: str(form, 'address'),
    country: str(form, 'country'),
    taxNumber: str(form, 'taxNumber'),
  };
  const formValues = { ...values, billingName: values.name };
  const payload = await payloadClient();
  const ui = await uiTexts(payload);
  const invalid = validateBilling(values, ui.billingErrors);
  if (invalid) return { error: invalid, values: formValues };
  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { billing: clean(values) },
      overrideAccess: false,
      user,
    });
  } catch (err) {
    payload.logger.error({ err, msg: 'billing update failed' });
    return { error: ui.accountErrors.saveFailed, values: formValues };
  }
  return { message: ui.accountErrors.billingSaved, values: formValues };
}
