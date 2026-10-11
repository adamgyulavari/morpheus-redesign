/**
 * The logged-in user on the public site (/belepes, /fiokom…). Same session as the admin: Payload's
 * HTTP-only `payload-token` cookie. Account pages read it on every request; nothing here goes
 * through the cached data layer (lib/data.ts), so user data is never cached or shared.
 */
import 'server-only';

import config from '@payload-config';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';
import { generatePayloadCookie } from 'payload/shared';
import { cache } from 'react';

import { SIGNED_IN_COOKIE } from '@/payload/session';

export const payloadClient = () => getPayload({ config });

/** The current user, or null. Once per request. */
export const getCurrentUser = cache(async () => {
  const payload = await payloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  return user;
});

/** The current user; logged-out visitors are sent to the login page and back here afterwards. */
export async function requireUser(path: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/belepes?vissza=${encodeURIComponent(path)}`);
  return user;
}

/** A path on this site to return to after login (never another host). */
export function safeReturnPath(value: unknown, fallback = '/fiokom'): string {
  const path = typeof value === 'string' ? value : '';
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : fallback;
}

type CookieObject = { name: string; value?: string; expires?: string; domain?: string; path?: string; secure?: boolean; httpOnly?: boolean; sameSite?: string };

const toNext = (c: CookieObject) => ({
  name: c.name,
  value: c.value ?? '',
  expires: c.expires ? new Date(c.expires) : undefined,
  domain: c.domain,
  path: c.path ?? '/',
  secure: c.secure,
  httpOnly: c.httpOnly,
  sameSite: (c.sameSite?.toLowerCase() as 'lax' | 'strict' | 'none' | undefined) ?? 'lax',
});

/** Sets the session cookie (from a Payload token) and the "signed in" hint, in a Server Action. */
export async function setSessionCookies(token: string, expires: Date) {
  const payload = await payloadClient();
  const session = generatePayloadCookie({
    collectionAuthConfig: payload.collections.users.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: true,
    token,
  }) as CookieObject;
  const jar = await cookies();
  jar.set(toNext(session));
  jar.set({ name: SIGNED_IN_COOKIE, value: '1', expires, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
}

export async function clearSessionCookies() {
  const payload = await payloadClient();
  const jar = await cookies();
  jar.delete(`${payload.config.cookiePrefix}-token`);
  jar.delete(SIGNED_IN_COOKIE);
}
