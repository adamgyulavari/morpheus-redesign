/**
 * Passwordless login ("Belépési link küldése"). Students log in rarely, so they can ask for a link
 * by e-mail instead of remembering a password.
 *
 * - The token is 32 random bytes; only its SHA-256 hash is stored (loginTokens), for 15 minutes,
 *   and it can be used once.
 * - Requesting a link never reveals whether the address has an account: the answer is always the
 *   same. Requests are rate limited per IP and per address (in memory: one server process).
 * - /belepes/link checks the token and starts a normal Payload session (payload/session.ts).
 */
import { createHash, randomBytes } from 'node:crypto';

import { sql } from '@payloadcms/db-postgres';
import type { Endpoint, Payload } from 'payload';

import { magicLink, siteUrl } from './email';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 10;
const MAX_PER_EMAIL = 3;

export const MAGIC_LINK_SENT = 'Ha ezzel az e-mail-címmel van megerősített fiók, elküldtük rá a belépési linket. Nézd meg a postafiókod (a spam mappát is).';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

// ── rate limit ──────────────────────────────────────────────────────────────

const hits = new Map<string, number[]>();

/** True if `key` is still under `max` requests in the window (and counts this one). */
export function allow(key: string, max: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // keep the map small: drop keys with no recent requests now and then
  if (hits.size > 5000) for (const [k, ts] of hits) if (!ts.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return true;
}

/** The client's address behind the proxy (Coolify's Traefik sets X-Forwarded-For). */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}

// ── request / consume ───────────────────────────────────────────────────────

export type MagicLinkResult = 'sent' | 'rate-limited';

/**
 * Sends a login link if the address belongs to a verified, unlocked account. Returns 'sent' in
 * every other case too (no account, unverified…), so callers can't tell them apart.
 */
export async function requestMagicLink(payload: Payload, rawEmail: string, ip: string): Promise<MagicLinkResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!allow(`ip:${ip}`, MAX_PER_IP)) return 'rate-limited';
  if (!email || !email.includes('@') || !allow(`email:${email}`, MAX_PER_EMAIL)) return 'sent';

  try {
    const { docs } = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, showHiddenFields: true });
    const user = docs[0];
    const locked = user?.lockUntil && new Date(user.lockUntil) > new Date();
    if (!user || user._verified === false || locked) return 'sent';

    // old links of this account stop working when a new one is sent; expired ones go too
    await payload.delete({
      collection: 'loginTokens',
      where: { or: [{ user: { equals: user.id } }, { expiresAt: { less_than: new Date().toISOString() } }] },
    });
    const token = randomBytes(32).toString('base64url');
    await payload.create({
      collection: 'loginTokens',
      data: { user: user.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString() },
    });
    await payload.sendEmail({
      to: user.email,
      subject: magicLink.subject,
      html: magicLink.html(siteUrl(`/belepes/link?token=${token}`), user),
    });
  } catch (err) {
    payload.logger.error({ err, msg: 'magic link: sending failed' });
  }
  return 'sent';
}

/**
 * Uses up a token: in one statement it is marked used, if it exists, is unused and has not expired
 * (so two clicks can't both log in). Returns the user's id, or null.
 */
export async function consumeMagicLink(payload: Payload, token: string): Promise<number | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const db = payload.db as unknown as { drizzle: { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: { user_id: number }[] }> } };
  const { rows } = await db.drizzle.execute(sql`
    UPDATE login_tokens SET used_at = now()
    WHERE token_hash = ${hash(token)} AND used_at IS NULL AND expires_at > now()
    RETURNING user_id`);
  return rows[0]?.user_id ?? null;
}

/** POST /api/users/magic-link { email } */
export const magicLinkEndpoint: Endpoint = {
  path: '/magic-link',
  method: 'post',
  handler: async (req) => {
    let email = '';
    try {
      email = String(((await req.json?.()) as { email?: unknown } | undefined)?.email ?? '');
    } catch {
      // not JSON: treated like an unknown address
    }
    const result = await requestMagicLink(req.payload, email, clientIp(req.headers));
    if (result === 'rate-limited') {
      return Response.json({ message: 'Túl sok kérés érkezett. Próbáld újra néhány perc múlva.' }, { status: 429 });
    }
    return Response.json({ message: MAGIC_LINK_SENT });
  },
};
