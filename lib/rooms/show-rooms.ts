/**
 * A show at our own venue (Teremfoglalási szabályok → A termek helyszíne) takes every room: it
 * keeps a session of kind "Előadás" from before its start (setting up) to after it (the show and
 * striking), saved with the show — by hand or by the Facebook sync. Whatever is in the way is
 * cancelled: student practice (the student gets the usual e-mail), other bookings and sessions
 * (no e-mail: the staff see them in the show's note and the sync's result, and talk to whoever
 * needs it). Moved, hidden, at another venue or deleted: the session follows or goes; otherwise
 * it is left alone (its times may be changed by hand).
 */
import type { PayloadRequest } from 'payload';
import { relId } from '@/payload/rel';
import type { Show } from '@/payload-types';

import { whenText } from './format';
import { BOOKING_KINDS } from './labels';
import { findClashes } from './occupancy';
import { at, dayOf } from './time';

type ShowDoc = Pick<Show, 'id' | 'date' | 'time' | 'venue' | 'production' | 'hidden'>;

const MINUTE = 60_000;

async function sessionOf(req: PayloadRequest, showId: number) {
  const { docs } = await req.payload.find({
    collection: 'sessions',
    where: { show: { equals: showId } },
    depth: 0,
    limit: 1,
    req,
    overrideAccess: true,
  });
  return docs[0] ?? null;
}

/** The show's session gone (it frees its rooms). */
export async function releaseShow(req: PayloadRequest, showId: number) {
  const session = await sessionOf(req, showId);
  if (session) await req.payload.delete({ collection: 'sessions', id: session.id, req, overrideAccess: true });
}

/**
 * After a show is saved: its session at our venue, in place (or none elsewhere). Returns what it
 * cancelled, as the note for the staff (also kept on the show), or null.
 */
export async function placeShow(req: PayloadRequest, show: ShowDoc, previous?: ShowDoc): Promise<string | null> {
  const { payload } = req;
  const settings = await payload.findGlobal({ slug: 'roomBookingSettings', depth: 0, req });
  const home = relId(settings.homeVenue);
  const ours = Boolean(home) && relId(show.venue) === home && !show.hidden;
  if (!ours) {
    await releaseShow(req, show.id);
    return null;
  }

  const startsAt = at(dayOf(new Date(String(show.date))), show.time);
  const start = new Date(startsAt.getTime() - (settings.showRoomsBefore ?? 90) * MINUTE);
  const end = new Date(startsAt.getTime() + (settings.showRoomsAfter ?? 150) * MINUTE);
  if (end.getTime() < Date.now()) return null; // over: left as it was

  const session = await sessionOf(req, show.id);
  const moved =
    !previous ||
    String(previous.date) !== String(show.date) ||
    previous.time !== show.time ||
    relId(previous.venue) !== relId(show.venue) ||
    Boolean(previous.hidden) !== Boolean(show.hidden);
  if (session && !moved) return null;
  const { docs: rooms } = await payload.find({
    collection: 'rooms',
    where: { active: { equals: true } },
    depth: 0,
    limit: 0,
    pagination: false,
    req,
    overrideAccess: true,
  });
  const roomIds = rooms.map((r) => r.id);

  // everything in the way goes: one line each
  const ownBooking = relId(session?.booking);
  const clashes = await findClashes(payload, req, roomIds, start, end, ownBooking ? [ownBooking] : []);
  const lines: string[] = [];
  const reason = `Előadás: ${show.time} (a termek lefoglalva)`;
  for (const bookingId of new Set(clashes.map((c) => c.bookingId))) {
    const c = clashes.find((x) => x.bookingId === bookingId);
    if (!c) continue;
    const when = whenText(c.start, c.end);
    if (c.kind === 'session') {
      const { docs } = await payload.find({
        collection: 'sessions',
        where: { booking: { equals: bookingId } },
        depth: 0,
        limit: 1,
        req,
        overrideAccess: true,
      });
      if (docs[0]) {
        req.context.silent = true;
        try {
          await payload.update({
            collection: 'sessions',
            id: docs[0].id,
            data: { status: 'cancelled' },
            req,
            overrideAccess: true,
          });
        } finally {
          req.context.silent = false;
        }
      }
      lines.push(`${c.title}, ${when} — elmarad (e-mail nem ment)`);
    } else {
      await payload.update({
        collection: 'roomBookings',
        id: bookingId,
        data: { status: 'cancelled', cancelReason: reason },
        req,
        overrideAccess: true,
      });
      lines.push(
        c.kind === 'practice'
          ? `${c.title}, ${when} — lemondva (a diák e-mailt kapott)`
          : `${BOOKING_KINDS[c.kind]}: ${c.title}, ${when} — lemondva (e-mail nem ment)`,
      );
    }
  }

  const data = {
    kind: 'show' as const,
    status: 'scheduled' as const,
    production: relId(show.production),
    show: show.id,
    start: start.toISOString(),
    end: end.toISOString(),
    locationType: 'room' as const,
    rooms: roomIds,
  };
  if (session) await payload.update({ collection: 'sessions', id: session.id, data, req, overrideAccess: true });
  else await payload.create({ collection: 'sessions', data, req, overrideAccess: true });

  if (!lines.length) return null;
  const note = `Lemondva az előadás miatt:\n${lines.map((l) => `• ${l}`).join('\n')}`;
  await payload.db.updateOne({ collection: 'shows', id: show.id, data: { roomNote: note }, req });
  return note;
}
