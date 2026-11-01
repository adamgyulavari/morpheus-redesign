/**
 * The student's calendar: the feed they subscribe to (/naptar/<token>.ics — the secret is the
 * account's `calendarToken`, made when /fiokom first shows it) and the one-event files of the
 * "Naptárba" buttons (/fiokom/naptar/<handle>). The same items as "Közelgő alkalmak", reaching back
 * a while so that past ones don't vanish from the calendar; groupmates' practice is left out.
 */
import { randomBytes } from 'node:crypto';
import { sql } from '@payloadcms/db-postgres';
import type { Payload, TypedUser } from 'payload';

import { myApplications } from '@/lib/applications/overview';
import type { IcsEvent } from '@/lib/rooms/ics';
import { studentOverview } from '@/lib/rooms/student';
import { dbOf } from '@/payload/db';
import { siteUrl } from '@/payload/email';
import type { UiStrings } from '@/payload/ui-catalogue';

import { type UpcomingItem, upcomingItems } from './items';

const DAYS_BACK = 60;
// a show's length isn't known: an evening's (as in the ticket e-mail's invite)
const SHOW_HOURS = 2;
const TOKEN = /^[\w-]{43}$/;

/** The account's feed secret, made the first time. */
export async function calendarToken(payload: Payload, userId: number): Promise<string> {
  const db = await dbOf(payload);
  const made = randomBytes(32).toString('base64url');
  await db.execute(sql`UPDATE users SET calendar_token = ${made} WHERE id = ${userId} AND calendar_token IS NULL`);
  const { rows } = await db.execute(sql`SELECT calendar_token FROM users WHERE id = ${userId}`);
  return String(rows[0]?.calendar_token ?? made);
}

export async function userByCalendarToken(payload: Payload, token: string): Promise<TypedUser | null> {
  if (!TOKEN.test(token)) return null;
  const { docs } = await payload.find({
    collection: 'users',
    where: { calendarToken: { equals: token } },
    depth: 0,
    limit: 1,
  });
  return (docs[0] as TypedUser | undefined) ?? null;
}

/** The person's items from a while ago on, without groupmates' practice. */
export async function calendarItems(payload: Payload, user: TypedUser, now = new Date()): Promise<UpcomingItem[]> {
  const since = new Date(now.getTime() - DAYS_BACK * 86_400_000);
  const o = await studentOverview(payload, user, since);
  const mine = await myApplications(
    payload,
    user,
    o.groups.map((g) => g.id),
    now,
    since,
  );
  return upcomingItems(o, mine, () => false).filter((i) => i.kind !== 'practice' || i.practice);
}

export function calendarEvent(i: UpcomingItem, kinds: UiStrings['upcoming']['kinds']): IcsEvent {
  const start = new Date(i.start);
  return {
    uid: i.uid,
    start,
    end: i.kind === 'show' ? new Date(start.getTime() + SHOW_HOURS * 3_600_000) : new Date(i.end),
    summary: i.kind === 'practice' ? `${kinds.practice}: ${i.title}` : i.title,
    location: i.place,
    description: siteUrl('/fiokom'),
    cancelled: i.cancelled,
  };
}
