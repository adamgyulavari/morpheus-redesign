/**
 * Places left for an application's date or course group, under a row lock (SELECT … FOR UPDATE in
 * the request's transaction), so two people can't take the last place at once. The Applications
 * collection refuses at 0; payments use the number to decide (a late payment: keep or refund).
 */
import { sql } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';

import { dbOf } from '@/payload/db';
import { relId } from '@/payload/rel';

import { placesLeft } from './rules';
import { TAKES_PLACE } from './sql';

type Target = { kind?: string | null; session?: unknown; courseGroup?: unknown };

/** null: no limit (or nothing to count: a szakmai application, a group-less one). */
export async function placesLeftFor(req: PayloadRequest, a: Target, ownId?: number): Promise<number | null> {
  const sessionId = a.kind === 'workshop' ? relId(a.session) : null;
  const groupId = a.kind === 'beginner' ? relId(a.courseGroup) : null;
  if (!sessionId && !groupId) return null;
  const db = await dbOf(req.payload, req);
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
