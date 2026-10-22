/** The round trip's cookie and addresses, shared by the two routes (/belepes/google[/callback]). */
import 'server-only';

import type { NextRequest } from 'next/server';

import { serverUrl } from '@/lib/env';

import type { Pending } from './oauth';

/** Why the login failed, as the callback sends it back (`/belepes?hiba=…`) → its text in Felületi szövegek → googleLogin. */
export const GOOGLE_ERRORS = {
  'google-megszakitva': 'cancelled',
  'google-email': 'unverified',
  google: 'failed',
} as const;
export type GoogleError = keyof typeof GOOGLE_ERRORS;

/** The login page's notice for `hiba`, when it is one of these. */
export const googleErrorText = (hiba: string | undefined, t: Record<(typeof GOOGLE_ERRORS)[GoogleError], string>) =>
  hiba && hiba in GOOGLE_ERRORS ? t[GOOGLE_ERRORS[hiba as GoogleError]] : undefined;

export const COOKIE = 'morpheus-google';
export const COOKIE_PATH = '/belepes/google';
/** Long enough to pick an account at Google. */
export const MAX_AGE = 10 * 60;

/** Where Google sends the visitor back (must be registered in the Google Cloud console). */
/**
 * An address on this site, for a redirect: from NEXT_PUBLIC_SERVER_URL — behind the proxy the request
 * itself says where the server listens (http://0.0.0.0:3000), not the site's address.
 */
export const siteAddress = (req: NextRequest, path: string) => new URL(path, serverUrl() || req.nextUrl.origin);

export const redirectUri = (req: NextRequest) => siteAddress(req, '/belepes/google/callback').href;

export const encode = (p: Pending) => Buffer.from(JSON.stringify(p)).toString('base64url');

export function decode(value: string | undefined): Pending | null {
  if (!value) return null;
  try {
    const p = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<Pending>;
    return p.state && p.verifier && p.nonce && typeof p.back === 'string' ? (p as Pending) : null;
  } catch {
    return null;
  }
}
