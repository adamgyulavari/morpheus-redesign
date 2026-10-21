/**
 * "Folytatás Google-fiókkal": Google's sign-in (OpenID Connect, the authorization code flow with
 * PKCE) — the only file that talks to Google. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` only in
 * env; the redirect address to register in the Google Cloud console is `<site>/belepes/google/callback`.
 *
 * The ID token comes straight from Google's token endpoint over HTTPS, in exchange for the code and
 * our secret, so its signature needn't be checked (Google's guide); its audience, issuer, expiry
 * and nonce are.
 */
import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

const AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** What the round trip remembers (in a short-lived cookie): checked when Google sends the visitor back. */
export type Pending = { state: string; verifier: string; nonce: string; back: string };

const random = () => randomBytes(32).toString('base64url');

/** A new round trip: what to remember, and where to send the visitor. */
export function start(redirectUri: string, back: string): { pending: Pending; url: string } {
  const pending = { state: random(), verifier: random(), nonce: random(), back };
  const url = new URL(AUTH);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: pending.state,
    nonce: pending.nonce,
    code_challenge: createHash('sha256').update(pending.verifier).digest('base64url'),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return { pending, url: url.toString() };
}

/** The person Google vouches for. */
export type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
};

type Claims = {
  iss?: string;
  aud?: string;
  exp?: number;
  nonce?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

/** The code Google sent back → who it is. Throws if anything doesn't add up. */
export async function finish(code: string, pending: Pending, redirectUri: string): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: pending.verifier,
    }),
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
  if (!res.ok || !body.id_token) throw new Error(`Google token: ${res.status} ${body.error ?? ''}`.trim());

  const claims = JSON.parse(Buffer.from(body.id_token.split('.')[1] ?? '', 'base64url').toString('utf8')) as Claims;
  if (!ISSUERS.includes(claims.iss ?? '')) throw new Error('Google token: wrong issuer');
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('Google token: wrong audience');
  if (!claims.exp || claims.exp * 1000 < Date.now()) throw new Error('Google token: expired');
  if (claims.nonce !== pending.nonce) throw new Error('Google token: wrong nonce');
  if (!claims.sub || !claims.email) throw new Error('Google token: no subject or e-mail');

  // without the split names (rare): all of it as the first name
  const firstName = claims.given_name?.trim() || claims.name?.trim() || claims.email.split('@')[0] || '-';
  return {
    sub: claims.sub,
    email: claims.email.trim().toLowerCase(),
    emailVerified: claims.email_verified === true || claims.email_verified === 'true',
    firstName,
    lastName: claims.family_name?.trim() || '-',
  };
}
