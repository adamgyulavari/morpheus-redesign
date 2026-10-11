import { NextResponse, type NextRequest } from 'next/server';

import { payloadClient } from '@/lib/auth';
import { serverUrl } from '@/lib/env';
import { consumeMagicLink } from '@/payload/magic-link';
import { issueSession, signedInCookie } from '@/payload/session';

/**
 * The link from the "Belépési link" e-mail: uses up the token and logs the user in with a normal
 * Payload session, then goes to /fiokom. Invalid, used or expired links go back to /belepes.
 */
export async function GET(req: NextRequest): Promise<Response> {
  // behind the proxy the request's own origin may be the container's address
  const url = (path: string) => new URL(path, serverUrl() || req.nextUrl.origin);
  const failed = NextResponse.redirect(url('/belepes?hiba=link'), 303);

  const payload = await payloadClient();
  const userId = await consumeMagicLink(payload, req.nextUrl.searchParams.get('token') ?? '');
  if (!userId) return failed;

  const user = await payload.findByID({ collection: 'users', id: userId, depth: 0, showHiddenFields: true, disableErrors: true });
  const locked = user?.lockUntil && new Date(user.lockUntil) > new Date();
  if (!user || user._verified === false || locked) return failed;

  const { cookie, expires } = await issueSession(payload, user.id);
  const res = NextResponse.redirect(url('/fiokom'), 303);
  res.cookies.set({
    name: cookie.name,
    value: cookie.value ?? '',
    expires: cookie.expires ? new Date(cookie.expires) : undefined,
    domain: cookie.domain,
    path: cookie.path ?? '/',
    httpOnly: true,
    secure: cookie.secure,
    sameSite: 'lax',
  });
  res.headers.append('Set-Cookie', signedInCookie(expires));
  return res;
}
