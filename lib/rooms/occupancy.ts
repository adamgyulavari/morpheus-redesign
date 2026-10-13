/**
 * The clash guarantee. Every confirmed room booking has one row per room in `room_occupancy`
 * (created by a migration, not a Payload collection), and Postgres refuses overlapping rows for the
 * same room (`EXCLUDE USING gist (room_id WITH =, period WITH &&)`), even for simultaneous requests.
 *
 * The rows are written from the roomBookings hooks inside the same transaction as the booking.
 * `findClashes` is the friendly pre-check (it names what is in the way); the constraint is the
 * guarantee when two requests race.
 */
import { sql } from '@payloadcms/db-postgres';
import { APIError, type Payload, type PayloadRequest } from 'payload';

import { monthDayShort } from '@/lib/dates';

import { whenText } from './format';
import { clockOf, dayOf } from './time';

type Row = Record<string, unknown>;
type Executor = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: Row[] }> };

/** The Drizzle instance of the request's transaction (as Payload's own adapter does), else the pool. */
async function dbOf(payload: Payload, req?: Partial<PayloadRequest>): Promise<Executor> {
  const adapter = payload.db as unknown as { drizzle: Executor; sessions?: Record<string, { db: Executor }> };
  const id = req?.transactionID ? await req.transactionID : undefined;
  return (id !== undefined && adapter.sessions?.[String(id)]?.db) || adapter.drizzle;
}

export type Clash = {
  bookingId: number;
  roomId: number;
  roomName: string;
  kind: 'session' | 'practice' | 'rental' | 'other';
  title: string;
  start: Date;
  end: Date;
  userId: number | null;
};

const ids = (list: (number | string)[]) =>
  sql.join(
    list.map((i) => sql`${Number(i)}`),
    sql`, `,
  );

/** Confirmed bookings overlapping the given rooms and time (half-open: 18:00–21:00 doesn't clash with 21:00–22:00). */
export async function findClashes(
  payload: Payload,
  req: Partial<PayloadRequest> | undefined,
  rooms: (number | string)[],
  start: Date,
  end: Date,
  excludeBookingIds: (number | string)[] = [],
): Promise<Clash[]> {
  if (!rooms.length) return [];
  const db = await dbOf(payload, req);
  const exclude = excludeBookingIds.length ? sql`AND o.booking_id NOT IN (${ids(excludeBookingIds)})` : sql``;
  const { rows } = await db.execute(sql`
    SELECT o.booking_id, o.room_id, r.name AS room_name, b.kind, b.display_title, b.start, b."end", b.user_id
    FROM room_occupancy o
    JOIN rooms r ON r.id = o.room_id
    JOIN room_bookings b ON b.id = o.booking_id
    WHERE o.room_id IN (${ids(rooms)})
      AND o.period && tstzrange(${start.toISOString()}::timestamptz, ${end.toISOString()}::timestamptz, '[)')
      ${exclude}
    ORDER BY b.start, r.name`);
  return rows.map((r) => ({
    bookingId: Number(r.booking_id),
    roomId: Number(r.room_id),
    roomName: String(r.room_name),
    kind: r.kind as Clash['kind'],
    title: String(r.display_title ?? ''),
    start: new Date(r.start as string),
    end: new Date(r.end as string),
    userId: r.user_id == null ? null : Number(r.user_id),
  }));
}

/** "Nagyterem, Próbaterem" — the rooms' names, in the given order. */
export async function roomNames(payload: Payload, ids: number[], req?: PayloadRequest): Promise<string> {
  if (!ids.length) return '';
  const { docs } = await payload.find({
    collection: 'rooms',
    where: { id: { in: ids } },
    depth: 0,
    select: { name: true },
    limit: 0,
    pagination: false,
    req,
  });
  return ids
    .map((id) => docs.find((r) => r.id === id)?.name)
    .filter(Boolean)
    .join(', ');
}

/** "Nagyterem, nov. 4. 18:00–21:00: Keddi szakmai II." */
export function describeClash(c: Clash): string {
  return `${c.roomName}, ${monthDayShort(dayOf(c.start))} ${clockOf(c.start)}–${clockOf(c.end)}${c.title ? `: ${c.title}` : ''}`;
}

/** "Ütközik: Nagyterem, nov. 4. 18:00–21:00: … (és még 2)" — for a non-empty list. */
export function clashMessage(clashes: Clash[]): string {
  const [first, ...rest] = clashes;
  if (!first) return '';
  return `Ütközik: ${describeClash(first)}${rest.length ? ` (és még ${rest.length})` : ''}`;
}

/** Rewrites a booking's rows: one per room while confirmed, none when cancelled. */
export async function syncOccupancy(
  payload: Payload,
  req: Partial<PayloadRequest> | undefined,
  booking: { id: number | string; rooms: (number | string)[]; start: Date; end: Date; confirmed: boolean },
  roomNames: () => Promise<string>,
): Promise<void> {
  const db = await dbOf(payload, req);
  await db.execute(sql`DELETE FROM room_occupancy WHERE booking_id = ${Number(booking.id)}`);
  if (!booking.confirmed || !booking.rooms.length) return;
  const period = sql`tstzrange(${booking.start.toISOString()}::timestamptz, ${booking.end.toISOString()}::timestamptz, '[)')`;
  const values = sql.join(
    booking.rooms.map((room) => sql`(${Number(booking.id)}, ${Number(room)}, ${period})`),
    sql`, `,
  );
  try {
    await db.execute(sql`INSERT INTO room_occupancy (booking_id, room_id, period) VALUES ${values}`);
  } catch (err) {
    // 23P01 = exclusion_violation: someone booked the same room in the meantime
    if ((err as { cause?: { code?: string } }).cause?.code === '23P01' || (err as { code?: string }).code === '23P01') {
      const when = whenText(booking.start, booking.end);
      throw new APIError(
        `Ez az időpont időközben foglalt lett (${await roomNames()}, ${when}). Válassz másikat.`,
        409,
        null,
        true,
      );
    }
    throw err;
  }
}
