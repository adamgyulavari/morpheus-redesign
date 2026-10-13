/**
 * Passwordless login ("Belépési link küldése"). Students log in rarely, so they can ask for a link
 * by e-mail instead of remembering a password.
 *
 * - The e-mail has a link and a 6-digit code; both are valid for 15 minutes, once (one of them).
 *   Only hashes are stored (loginTokens): SHA-256 of the 32-byte token, an HMAC of the code.
 * - Opening the link doesn't log in yet: /belepes/link shows a "Belépés" button, and only that
 *   (a POST) uses up the token. Mail scanners that open links (e.g. Outlook Safe Links) therefore
 *   can't use it up before the person does.
 * - The code is for a different device (link requested on the laptop, e-mail read on the phone):
 *   typed on /belepes. 5 wrong codes invalidate the code and its link; after 10 wrong codes in a day
 *   code login is off for the account until they age out (the e-mailed link still works).
 * - Requesting a link never reveals whether the address has an account: the answer is always the
 *   same. Requests are rate limited per IP and per address (in memory: one server process).
 * - A successful link or code starts a normal Payload session (payload/session.ts).
 */
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

import { sql } from '@payloadcms/db-postgres';
import type { Endpoint, Payload } from 'payload';

import { magicLink, siteUrl } from './email';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 10;
const MAX_PER_EMAIL = 3;
const MAX_CODE_ATTEMPTS = 5;
/** Wrong codes per account in 24 hours; then code login is off for it until they age out (links still work). */
const MAX_CODE_FAILURES_PER_DAY = 10;

export const MAGIC_LINK_SENT =
  'Ha ezzel az e-mail-címmel van fiók, elküldtük rá a belépési linket és kódot. Nézd meg a postafiókod (a spam mappát is).';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');
/** The code's hash, keyed with the server secret and salted with its token (6 digits are few). */
const codeHash = (secret: string, tokenHash: string, code: string) =>
  createHmac('sha256', secret).update(`${tokenHash}:${code}`).digest('hex');

type Db = { drizzle: { execute: <T>(q: ReturnType<typeof sql>) => Promise<{ rows: T[] }> } };
const db = (payload: Payload) => payload.db as unknown as Db;

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
  if (!email.includes('@') || !allow(`email:${email}`, MAX_PER_EMAIL)) return 'sent';

  try {
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      showHiddenFields: true,
    });
    const user = docs[0];
    const locked = user?.lockUntil && new Date(user.lockUntil) > new Date();
    // unverified accounts too: using the link proves the address (and verifies it)
    if (!user || locked) return 'sent';
    const { url, code } = await createLoginLink(payload, user.id, { ttlMs: TOKEN_TTL_MS, withCode: true });
    await payload.sendEmail({
      to: user.email,
      subject: magicLink.subject,
      html: magicLink.html(url, code ?? '', user),
    });
  } catch (err) {
    payload.logger.error({ err, msg: 'magic link: sending failed' });
  }
  return 'sent';
}

/**
 * A new login link for the account (older unused ones stop working), optionally with a 6-digit
 * code. The "Belépési link" e-mail's lasts 15 minutes; the ones in application e-mails a week.
 */
export async function createLoginLink(
  payload: Payload,
  userId: number,
  { ttlMs, withCode = false }: { ttlMs: number; withCode?: boolean },
): Promise<{ url: string; code?: string }> {
  // older links of this account stop working when a new one is sent. They are kept for a day
  // (their wrong-code counts make up the daily cap), then deleted.
  await db(payload).drizzle.execute(sql`
    UPDATE login_tokens SET expires_at = now() WHERE user_id = ${userId} AND used_at IS NULL AND expires_at > now()`);
  await db(payload).drizzle.execute(
    sql`DELETE FROM login_tokens WHERE created_at < now() - interval '24 hours' AND expires_at < now()`,
  );
  const token = randomBytes(32).toString('base64url');
  const code = withCode ? String(randomInt(0, 1_000_000)).padStart(6, '0') : undefined;
  const tokenHash = hash(token);
  await payload.create({
    collection: 'loginTokens',
    data: {
      user: userId,
      tokenHash,
      codeHash: code ? codeHash(payload.secret, tokenHash, code) : null,
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    },
  });
  return { url: siteUrl(`/belepes/link?token=${token}`), code };
}

/** A week: for the links in application e-mails (sign-up confirmations, admission). */
export const APPLICATION_LINK_TTL_MS = 7 * 86_400_000;

const validToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

/** Not locked: may log in with a link or code (both came by e-mail, so they prove the address). */
async function canLogIn(payload: Payload, userId: number): Promise<{ id: number; email: string } | null> {
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    showHiddenFields: true,
    disableErrors: true,
  });
  const locked = user?.lockUntil && new Date(user.lockUntil) > new Date();
  return user && !locked ? { id: user.id, email: user.email } : null;
}

/** A used link or code proves the address: accounts made by a sign-up form become verified. */
async function loggedInWith(payload: Payload, userId: number | null | undefined): Promise<number | null> {
  if (!userId || !(await canLogIn(payload, userId))) return null;
  await db(payload).drizzle.execute(
    sql`UPDATE users SET _verified = true WHERE id = ${userId} AND _verified IS NOT TRUE`,
  );
  return userId;
}

/** Looks at a link without using it up: whose is it, if it is still valid (for the confirm page). */
export async function peekMagicLink(payload: Payload, token: string): Promise<{ email: string } | null> {
  if (!validToken(token)) return null;
  const { rows } = await db(payload).drizzle.execute<{ user_id: number | null }>(sql`
    SELECT user_id FROM login_tokens
    WHERE token_hash = ${hash(token)} AND used_at IS NULL AND expires_at > now() AND coalesce(attempts, 0) < ${MAX_CODE_ATTEMPTS}`);
  const userId = rows[0]?.user_id;
  return userId ? canLogIn(payload, userId) : null;
}

/**
 * Uses up a link: in one statement it is marked used, if it exists, is unused and has not expired
 * (so two clicks can't both log in). Returns the user's id, or null.
 */
export async function consumeMagicLink(payload: Payload, token: string): Promise<number | null> {
  if (!validToken(token)) return null;
  const { rows } = await db(payload).drizzle.execute<{ user_id: number | null }>(sql`
    UPDATE login_tokens SET used_at = now()
    WHERE token_hash = ${hash(token)} AND used_at IS NULL AND expires_at > now() AND coalesce(attempts, 0) < ${MAX_CODE_ATTEMPTS}
    RETURNING user_id`);
  return loggedInWith(payload, rows[0]?.user_id);
}

/**
 * Logs in with the code from the e-mail: checks it against the address's latest valid link and
 * uses that up. A wrong code counts; after 5 the link and code stop working. Returns the user's id.
 */
export async function consumeLoginCode(payload: Payload, rawEmail: string, rawCode: string): Promise<number | null> {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.replace(/\s/g, '');
  if (!/^\d{6}$/.test(code) || !email) return null;
  const { rows } = await db(payload).drizzle.execute<{
    id: number;
    token_hash: string;
    code_hash: string | null;
    attempts: string | number | null;
  }>(sql`
    SELECT t.id, t.token_hash, t.code_hash, t.attempts FROM login_tokens t JOIN users u ON u.id = t.user_id
    WHERE lower(u.email) = ${email} AND t.used_at IS NULL AND t.expires_at > now()
    ORDER BY t.created_at DESC LIMIT 1`);
  const row = rows[0];
  if (!row?.code_hash || Number(row.attempts ?? 0) >= MAX_CODE_ATTEMPTS) return null;
  // someone requesting new codes for an address to keep guessing: 6 digits are few
  const failures = await db(payload).drizzle.execute<{ n: string | number }>(sql`
    SELECT coalesce(sum(attempts), 0) AS n FROM login_tokens
    WHERE user_id = (SELECT user_id FROM login_tokens WHERE id = ${row.id}) AND created_at > now() - interval '24 hours'`);
  if (Number(failures.rows[0]?.n ?? 0) >= MAX_CODE_FAILURES_PER_DAY) return null;

  const expected = Buffer.from(row.code_hash, 'hex');
  const given = Buffer.from(codeHash(payload.secret, row.token_hash, code), 'hex');
  if (!timingSafeEqual(expected, given)) {
    await db(payload).drizzle.execute(
      sql`UPDATE login_tokens SET attempts = coalesce(attempts, 0) + 1 WHERE id = ${row.id}`,
    );
    return null;
  }
  const used = await db(payload).drizzle.execute<{ user_id: number | null }>(sql`
    UPDATE login_tokens SET used_at = now()
    WHERE id = ${row.id} AND used_at IS NULL AND expires_at > now()
    RETURNING user_id`);
  return loggedInWith(payload, used.rows[0]?.user_id);
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
