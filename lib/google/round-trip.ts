/** The round trip's cookie and addresses, shared by the two routes (/belepes/google[/callback]). */
import 'server-only';

import type { NextRequest } from 'next/server';

import { serverUrl } from '@/lib/env';

import type { Pending } from './oauth';

export const COOKIE = 'morpheus-google';
export const COOKIE_PATH = '/belepes/google';
/** Long enough to pick an account at Google. */
export const MAX_AGE = 10 * 60;

/** Where Google sends the visitor back (must be registered in the Google Cloud console). */
export const redirectUri = (req: NextRequest) => `${serverUrl() || req.nextUrl.origin}/belepes/google/callback`;

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
