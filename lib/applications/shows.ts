/**
 * Shows booked on the site (Jegyfoglalás → Saját foglalás): the seats taken, the facts the rules
 * decide on, what the e-mails say about one. A booking is an application of kind "show" with its
 * seats; free ones are booked here, paid ones through the checkout (lib/payments).
 */
import { sql } from '@payloadcms/db-postgres';
import type { Payload, PayloadRequest } from 'payload';

import { showDateLine } from '@/lib/dates';
import { formatHuf } from '@/lib/format';
import { at } from '@/lib/rooms/time';
import { dbOf } from '@/payload/db';
import type { Show } from '@/payload-types';

import type { TargetInfo } from './notify';
import type { ShowFacts } from './rules';
import { inList, TAKES_PLACE } from './sql';

/** Seats taken per show (booked, or awaiting payment within the hold). */
export async function seatsTaken(payload: Payload, ids: number[], req?: PayloadRequest): Promise<Map<number, number>> {
  if (!ids.length) return new Map();
  const db = await dbOf(payload, req);
  const { rows } = await db.execute(sql`
    SELECT show_id AS id, coalesce(sum(seats) FILTER (WHERE ${TAKES_PLACE}), 0)::int AS taken
    FROM applications WHERE kind = 'show' AND show_id IN (${inList(ids)})
    GROUP BY show_id`);
  return new Map(rows.map((r) => [Number(r.id), Number(r.taken)]));
}

/** The seats of someone's own hold on a show (still valid): a new checkout replaces it. */
export async function ownHeldSeats(payload: Payload, showId: number, email: string): Promise<number> {
  const db = await dbOf(payload);
  const { rows } = await db.execute(sql`
    SELECT coalesce(sum(seats), 0)::int AS n FROM applications
    WHERE kind = 'show' AND show_id = ${showId} AND lower(email) = ${email.trim().toLowerCase()}
      AND status = 'held' AND hold_until > now()`);
  return Number(rows[0]?.n ?? 0);
}

/** The stored day (noon, Budapest) and the time: the moment it starts. */
export const showStart = (s: Pick<Show, 'date' | 'time'>) => at(String(s.date).slice(0, 10), s.time);

/** Booked on the site (and not hidden)? */
export const bookedHere = (s: Pick<Show, 'bookingMode' | 'hidden'>) => s.bookingMode === 'internal' && !s.hidden;

export function showFacts(s: Show, taken: number): ShowFacts {
  return {
    start: showStart(s),
    open: bookedHere(s) && s.booking?.open !== false,
    seats: s.booking?.seats ?? 0,
    taken,
  };
}

/** A ticket's price (0: free registration). */
export const ticketPrice = (s: Pick<Show, 'booking'>) => Math.max(0, Math.round(s.booking?.price ?? 0));

/** The show by its public code (its booking link), if it is booked on the site. */
export async function showByCode(payload: Payload, code: string) {
  if (!code || code.length > 32) return null;
  const { docs } = await payload.find({
    collection: 'shows',
    where: { and: [{ code: { equals: code } }, { bookingMode: { equals: 'internal' } }] },
    depth: 1,
    limit: 1,
  });
  return docs[0] ?? null;
}

/** What the e-mails and the checkout say about a booking (depth 1: the production and venue). */
export function showInfo(s: Show, seats?: number): TargetInfo {
  const production = typeof s.production === 'object' ? s.production : null;
  const venue = typeof s.venue === 'object' ? s.venue : null;
  const price = ticketPrice(s);
  return {
    title: production?.title ?? s.title ?? '',
    when: showDateLine(String(s.date).slice(0, 10), s.time),
    place: venue?.name ?? undefined,
    price: price ? `${formatHuf(price)} / jegy` : undefined,
    seats,
  };
}
