/**
 * Places left for an application's date, course group or show (seats), under a row lock (SELECT …
 * FOR UPDATE in the request's transaction), so two people can't take the last place at once. The
 * Applications collection refuses what doesn't fit; payments use it to decide (a late payment:
 * keep or refund).
 */
import { sql } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';

import { dbOf } from '@/payload/db';
import { relId } from '@/payload/rel';

import { placesLeft } from './rules';
import { TAKES_PLACE } from './sql';

type Target = { kind?: string | null; session?: unknown; courseGroup?: unknown; show?: unknown; seats?: number | null };

/** null: no limit (or nothing to count: a szakmai application, a group-less one). */
export async function placesLeftFor(req: PayloadRequest, a: Target, ownId?: number): Promise<number | null> {
  const sessionId = a.kind === 'workshop' ? relId(a.session) : null;
  const groupId = a.kind === 'beginner' ? relId(a.courseGroup) : null;
  const showId = a.kind === 'show' ? relId(a.show) : null;
  const db = await dbOf(req.payload, req);
  if (showId) {
    const { rows } = await db.execute(sql`SELECT booking_seats AS max FROM shows WHERE id = ${showId} FOR UPDATE`);
    const { rows: taken } = await db.execute(sql`
      SELECT coalesce(sum(seats), 0)::int AS n FROM applications
      WHERE show_id = ${showId} AND ${TAKES_PLACE} AND id <> ${ownId ?? 0}`);
    return placesLeft(rows[0]?.max == null ? 0 : Number(rows[0].max), Number(taken[0]?.n ?? 0));
  }
  if (!sessionId && !groupId) return null;
  const { rows } = sessionId
    ? await db.execute(sql`SELECT workshop_max_participants AS max FROM sessions WHERE id = ${sessionId} FOR UPDATE`)
    : await db.execute(sql`SELECT signup_capacity AS max FROM course_groups WHERE id = ${groupId} FOR UPDATE`);
  const max = rows[0]?.max == null ? null : Number(rows[0].max);
  if (max == null) return null;
  const target = sessionId ? sql`session_id = ${sessionId}` : sql`course_group_id = ${groupId}`;
  const { rows: count } = await db.execute(sql`
    SELECT count(*)::int AS n FROM applications
    WHERE ${target} AND ${TAKES_PLACE} AND id <> ${ownId ?? 0}`);
  return placesLeft(max, Number(count[0]?.n ?? 0));
}

/** Does the application fit in what is left (a show booking needs its seats, anything else one place)? */
export async function fits(req: PayloadRequest, a: Target, ownId?: number): Promise<boolean> {
  const left = await placesLeftFor(req, a, ownId);
  return left === null || left >= (a.kind === 'show' ? Math.max(1, a.seats ?? 1) : 1);
}
