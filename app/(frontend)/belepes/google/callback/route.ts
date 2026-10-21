/**
 * Back from Google: the round trip checked (state), the code exchanged for who it is, their account
 * found / linked / made (lib/google/accounts), and a session like every other login.
 */
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { payloadClient, setSessionCookies } from '@/lib/auth';
import { accountForGoogle } from '@/lib/google/accounts';
import { finish, googleConfigured } from '@/lib/google/oauth';
import { COOKIE, COOKIE_PATH, decode, type GoogleError, redirectUri, siteAddress } from '@/lib/google/round-trip';
import { allow, clientIp } from '@/payload/magic-link';
import { issueSession } from '@/payload/session';

export async function GET(req: NextRequest) {
  const jar = await cookies();
  const pending = decode(jar.get(COOKIE)?.value);
  jar.delete({ name: COOKIE, path: COOKIE_PATH });
  const params = req.nextUrl.searchParams;
  const back = (hiba: GoogleError) => {
    const to = siteAddress(req, '/belepes');
    to.searchParams.set('hiba', hiba);
    if (pending?.back && pending.back !== '/fiokom') to.searchParams.set('vissza', pending.back);
    return NextResponse.redirect(to);
  };

  if (!googleConfigured()) return NextResponse.redirect(siteAddress(req, '/belepes'));
  // cancelled at Google (or refused the permissions)
  if (params.get('error')) return back('google-megszakitva');
  const code = params.get('code');
  if (!pending || !code || params.get('state') !== pending.state) return back('google');
  if (!allow(`google:${clientIp(req.headers)}`, 20)) return back('google');

  const payload = await payloadClient();
  try {
    const identity = await finish(code, pending, redirectUri(req));
    if (!identity.emailVerified) return back('google-email');
    const userId = await accountForGoogle(payload, identity);
    const { token, expires, user } = await issueSession(payload, userId);
    await setSessionCookies(token, expires, user);
  } catch (err) {
    payload.logger.error({ err, msg: 'Google login failed' });
    return back('google');
  }
  return NextResponse.redirect(siteAddress(req, pending.back));
}
