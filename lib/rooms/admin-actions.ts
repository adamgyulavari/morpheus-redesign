'use server';

/**
 * The admin room calendar (/admin/teremnaptar). Staff only; writes go through the Local API with the
 * staff member's own rights, so the collections' access rules and the admin-only override still apply.
 */
import type { TypedUser } from 'payload';

import { getCurrentUser, payloadClient } from '@/lib/auth';
import { userIsStaffOrAdmin } from '@/payload/access';

import type { LocationType, SessionKind } from './labels';
import {
  applyFill,
  deletableGenerated,
  deleteGenerated,
  errorMessage,
  getRoomSchedule,
  monthGroups,
  previewFill,
  roomsById,
  type ScheduleEvent,
  unplacedSessions,
  type WorkshopFill,
} from './server';

type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: string };

async function staff(): Promise<TypedUser | null> {
  const user = await getCurrentUser();
  return user && userIsStaffOrAdmin(user) ? user : null;
}
const denied = { ok: false as const, reason: 'Ehhez munkatársi jogosultság kell.' };

/** Rooms, groups and productions for the calendar's pickers. */
export async function calendarOptions() {
  if (!(await staff())) return null;
  const payload = await payloadClient();
  const [rooms, groups, productions] = await Promise.all([
    roomsById(payload),
    payload.find({
      collection: 'courseGroups',
      depth: 0,
      sort: 'title',
      limit: 0,
      pagination: false,
      select: { title: true },
    }),
    payload.find({
      collection: 'productions',
      depth: 0,
      sort: 'title',
      limit: 0,
      pagination: false,
      draft: true,
      select: { title: true },
    }),
  ]);
  return {
    rooms: rooms.filter((r) => r.active),
    groups: groups.docs.map((g) => ({ id: g.id, title: g.title })),
    productions: productions.docs.map((p) => ({ id: p.id, title: p.title })),
  };
}

export async function adminSchedule(
  from: string,
  to: string,
): Promise<{ events: ScheduleEvent[]; unplaced: Awaited<ReturnType<typeof unplacedSessions>> } | null> {
  const user = await staff();
  if (!user) return null;
  const payload = await payloadClient();
  const [events, unplaced] = await Promise.all([
    getRoomSchedule(payload, user, new Date(from), new Date(to)),
    unplacedSessions(payload, new Date(from), new Date(to)),
  ]);
  return { events: events ?? [], unplaced };
}

export type SessionInput = {
  kind: SessionKind;
  title?: string;
  courseGroup?: number | null;
  production?: number | null;
  start: string;
  end: string;
  locationType: LocationType;
  roomIds: number[];
  externalLocation?: string;
  overridePractice?: boolean;
};

export async function createSession(input: SessionInput): Promise<Result<{ id: number }>> {
  const user = await staff();
  if (!user) return denied;
  try {
    const doc = await (await payloadClient()).create({
      collection: 'sessions',
      data: {
        kind: input.kind,
        title: input.title || null,
        courseGroup: input.courseGroup ?? null,
        production: input.production ?? null,
        start: input.start,
        end: input.end,
        locationType: input.locationType,
        rooms: input.roomIds,
        externalLocation: input.externalLocation || null,
        status: 'scheduled',
        overridePractice: input.overridePractice,
      },
      user,
      overrideAccess: false,
    });
    return { ok: true, id: doc.id };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}

export type SessionChange = Partial<
  Pick<SessionInput, 'start' | 'end' | 'locationType' | 'roomIds' | 'externalLocation' | 'overridePractice'>
> & {
  status?: 'scheduled' | 'cancelled';
};

/** Moves / places / cancels a session; its booking follows (or it becomes unplaced on a clash). */
export async function updateSession(id: number, change: SessionChange): Promise<Result<{ locationType: string }>> {
  const user = await staff();
  if (!user) return denied;
  const { roomIds, ...rest } = change;
  try {
    const doc = await (await payloadClient()).update({
      collection: 'sessions',
      id,
      data: { ...rest, ...(roomIds ? { rooms: roomIds } : {}) },
      user,
      overrideAccess: false,
    });
    return { ok: true, locationType: doc.locationType };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}

export type BookingInput = {
  kind: 'rental' | 'other';
  title: string;
  start: string;
  end: string;
  roomIds: number[];
  overridePractice?: boolean;
};

export async function createBooking(input: BookingInput): Promise<Result<{ id: number }>> {
  const user = await staff();
  if (!user) return denied;
  try {
    const doc = await (await payloadClient()).create({
      collection: 'roomBookings',
      data: { ...input, rooms: input.roomIds, status: 'confirmed' },
      user,
      overrideAccess: false,
    });
    return { ok: true, id: doc.id };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}

/** Moves / cancels a booking (a session's booking is moved through its session instead). */
export async function updateBooking(
  id: number,
  change: {
    start?: string;
    end?: string;
    roomIds?: number[];
    status?: 'confirmed' | 'cancelled';
    cancelReason?: string;
    overridePractice?: boolean;
  },
): Promise<Result> {
  const user = await staff();
  if (!user) return denied;
  const payload = await payloadClient();
  const { roomIds, ...rest } = change;
  try {
    const booking = await payload.findByID({ collection: 'roomBookings', id, depth: 0, user, overrideAccess: false });
    if (booking.kind === 'session' && booking.session) {
      const sessionId = typeof booking.session === 'object' ? booking.session.id : booking.session;
      return updateSession(sessionId, {
        start: rest.start,
        end: rest.end,
        roomIds,
        overridePractice: rest.overridePractice,
        ...(rest.status === 'cancelled' ? { status: 'cancelled' } : {}),
      });
    }
    await payload.update({
      collection: 'roomBookings',
      id,
      data: { ...rest, ...(roomIds ? { rooms: roomIds } : {}) },
      user,
      overrideAccess: false,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}

// ── fill month ──────────────────────────────────────────────────────────────

/** The groups running in the month, and the Nyitott Műhely defaults. */
export async function groupsOfMonth(year: number, month: number) {
  if (!(await staff())) return null;
  return monthGroups(await payloadClient(), year, month);
}

export async function fillMonthPreview(year: number, month: number, groupIds: number[], workshop: WorkshopFill | null) {
  if (!(await staff())) return null;
  return previewFill(await payloadClient(), year, month, groupIds, workshop);
}

export async function fillMonthApply(
  year: number,
  month: number,
  groupIds: number[],
  keys: string[],
  workshop: WorkshopFill | null,
) {
  const user = await staff();
  if (!user) return null;
  return applyFill(await payloadClient(), user, year, month, groupIds, keys, workshop);
}

/** What "Generált alkalmak törlése" would delete in the month. */
export async function generatedPreview(year: number, month: number, groupIds: number[], workshops: boolean) {
  if (!(await staff())) return null;
  return deletableGenerated(await payloadClient(), year, month, groupIds, workshops);
}

export async function deleteGeneratedSessions(
  year: number,
  month: number,
  groupIds: number[],
  ids: number[],
  workshops: boolean,
) {
  const user = await staff();
  if (!user) return null;
  return deleteGenerated(await payloadClient(), user, year, month, groupIds, ids, workshops);
}

/** Deletes a session (and its booking), or a booking without a session. */
export async function deleteEntry(target: { sessionId?: number; bookingId?: number }): Promise<Result> {
  const user = await staff();
  if (!user) return denied;
  const payload = await payloadClient();
  try {
    if (target.sessionId)
      await payload.delete({ collection: 'sessions', id: target.sessionId, user, overrideAccess: false });
    else if (target.bookingId)
      await payload.delete({ collection: 'roomBookings', id: target.bookingId, user, overrideAccess: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}
