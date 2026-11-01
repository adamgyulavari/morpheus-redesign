/**
 * Merging two accounts of one person (admin → Felhasználók → the account → „Fiók összevonása”):
 * typically a preloaded account (its group, its history) and the one made at the first Google login
 * with another address. The opened account stays; everything of the other moves to it —
 * applications, tickets, orders, invoices, refunds, room bookings, group memberships, roles — what it
 * lacks is taken from the other (Google, phone, billing details), and the other is deleted. One
 * transaction; nobody is e-mailed.
 */
import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';

import { inTransaction } from '@/lib/applications/server';
import { dbOf } from '@/payload/db';
import type { User } from '@/payload-types';

type Account = Pick<
  User,
  'id' | 'name' | 'email' | 'googleSub' | 'phone' | '_verified' | 'roomBooking' | 'billing' | 'roles'
>;

/** The kept account's details after the merge, or why the two can't be merged. */
export function mergedProfile(
  keep: Account,
  drop: Account,
  emailFrom: 'keep' | 'drop',
):
  | {
      ok: true;
      email: string;
      googleSub: string | null;
      phone: string | null;
      verified: boolean;
      roomBooking: boolean;
      billing: Account['billing'];
      roles: NonNullable<Account['roles']>;
    }
  | { ok: false; reason: string } {
  if (keep.id === drop.id) return { ok: false, reason: 'Ez ugyanaz a fiók.' };
  if (drop.roles?.includes('admin'))
    return { ok: false, reason: 'Adminisztrátori fiókot nem lehet beolvasztani; fordítva vond össze.' };
  if (keep.googleSub && drop.googleSub && keep.googleSub !== drop.googleSub)
    return { ok: false, reason: 'Mindkét fiókhoz más Google-fiók tartozik.' };
  // a guest becomes whatever the other is (student, staff); "guest" stays only if nothing else
  const roles = [...new Set([...(keep.roles ?? []), ...(drop.roles ?? [])])];
  const real = roles.filter((r) => r !== 'guest');
  return {
    ok: true,
    email: emailFrom === 'keep' ? keep.email : drop.email,
    googleSub: keep.googleSub || drop.googleSub || null,
    phone: keep.phone || drop.phone || null,
    verified: Boolean(keep._verified || drop._verified),
    roomBooking: Boolean(keep.roomBooking || drop.roomBooking),
    billing: keep.billing?.name ? keep.billing : drop.billing?.name ? drop.billing : keep.billing,
    roles: real.length ? real : roles,
  };
}

/** Where the other account appears (moved over by the merge). */
const REFERENCES = [
  ['applications', 'user_id', 'jelentkezés'],
  ['applications_tickets', 'used_by_id', 'beengedett jegy'],
  ['orders', 'user_id', 'rendelés'],
  ['invoices', 'user_id', 'számla'],
  ['payments_refunds', 'by_id', 'visszatérítés (végezte)'],
  ['room_bookings', 'user_id', 'teremfoglalás'],
  ['room_bookings', 'cancelled_by_id', 'lemondott foglalás (lemondta)'],
] as const;

export type MergePreview = {
  other: { id: number; name: string; email: string; google: boolean };
  /** What moves over, e.g. "2 jelentkezés", "csoport: Kezdő 2026 ősz". */
  moves: string[];
  problem?: string;
};

async function account(payload: Payload, where: { id: number } | { email: string }) {
  const { docs } = await payload.find({
    collection: 'users',
    where: 'id' in where ? { id: { equals: where.id } } : { email: { equals: where.email.trim().toLowerCase() } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
  });
  return (docs[0] as Account | undefined) ?? null;
}

/** The other account (by its e-mail) and what of it would move to the kept one. */
export async function mergePreview(payload: Payload, keepId: number, otherEmail: string): Promise<MergePreview | null> {
  const [keep, other] = await Promise.all([account(payload, { id: keepId }), account(payload, { email: otherEmail })]);
  if (!keep || !other) return null;
  const db = await dbOf(payload);
  const moves: string[] = [];
  for (const [table, column, label] of REFERENCES) {
    const { rows } = await db.execute(
      sql`SELECT count(*)::int AS n FROM ${sql.identifier(table)} WHERE ${sql.identifier(column)} = ${other.id}`,
    );
    const n = Number(rows[0]?.n ?? 0);
    if (n) moves.push(`${n} ${label}`);
  }
  const { rows: groups } = await db.execute(sql`
    SELECT g.title, r.path FROM course_groups_rels r JOIN course_groups g ON g.id = r.parent_id
    WHERE r.users_id = ${other.id} AND r.path IN ('students', 'instructors') ORDER BY g.title`);
  for (const g of groups) moves.push(`${g.path === 'instructors' ? 'oktató' : 'csoport'}: ${g.title}`);
  const merged = mergedProfile(keep, other, 'keep');
  return {
    other: { id: other.id, name: other.name ?? '', email: other.email, google: Boolean(other.googleSub) },
    moves,
    ...(merged.ok ? {} : { problem: merged.reason }),
  };
}

/** Moves everything of `dropId` to `keepId`, then deletes it; the kept e-mail is the chosen one's. */
export async function mergeUsers(
  payload: Payload,
  keepId: number,
  dropId: number,
  emailFrom: 'keep' | 'drop',
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [keep, drop] = await Promise.all([account(payload, { id: keepId }), account(payload, { id: dropId })]);
  if (!keep || !drop) return { ok: false, reason: 'Nincs ilyen fiók.' };
  const m = mergedProfile(keep, drop, emailFrom);
  if (!m.ok) return m;
  await inTransaction(payload, async (req) => {
    const db = await dbOf(payload, req);
    for (const [table, column] of REFERENCES)
      await db.execute(
        sql`UPDATE ${sql.identifier(table)} SET ${sql.identifier(column)} = ${keepId} WHERE ${sql.identifier(column)} = ${dropId}`,
      );
    // group memberships: moved, unless the kept account is already there (then the other's row goes with it)
    await db.execute(sql`
      UPDATE course_groups_rels r SET users_id = ${keepId}
      WHERE r.users_id = ${dropId} AND NOT EXISTS (
        SELECT 1 FROM course_groups_rels k WHERE k.parent_id = r.parent_id AND k.path = r.path AND k.users_id = ${keepId})`);
    // its login links and logins, preferences and locks go with it (cascade); the address and the
    // Google id are free once it is gone
    await db.execute(sql`DELETE FROM login_tokens WHERE user_id = ${dropId}`);
    await db.execute(sql`DELETE FROM users WHERE id = ${dropId}`);
    const b = m.billing ?? {};
    await db.execute(sql`
      UPDATE users SET email = ${m.email}, google_sub = ${m.googleSub}, phone = ${m.phone},
        _verified = ${m.verified}, room_booking = ${m.roomBooking},
        billing_name = ${b.name ?? null}, billing_tax_number = ${b.taxNumber ?? null}, billing_zip = ${b.zip ?? null},
        billing_city = ${b.city ?? null}, billing_country = ${b.country ?? 'HU'}, billing_address = ${b.address ?? null},
        login_attempts = 0, lock_until = NULL, updated_at = now()
      WHERE id = ${keepId}`);
    await db.execute(sql`DELETE FROM users_roles WHERE parent_id = ${keepId}`);
    for (const [i, role] of m.roles.entries())
      await db.execute(sql`INSERT INTO users_roles ("order", parent_id, value) VALUES (${i + 1}, ${keepId}, ${role})`);
  });
  payload.logger.info({ msg: 'accounts merged', keepId, dropId });
  return { ok: true };
}
