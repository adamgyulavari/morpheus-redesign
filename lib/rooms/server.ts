/**
 * Room-calendar server logic (no 'use server' here — see student-actions.ts and admin-actions.ts).
 * Everything goes through the Payload Local API; room data is staff-only in the API, so student
 * reads and writes happen here, after these checks, never through the raw API.
 */

import type { Payload, TypedUser } from 'payload';
import { userIsAdmin, userIsStaffOrAdmin } from '@/payload/access';
import { relId, relIds } from '@/payload/collections/RoomBookings';

import { generatedKey, groupsInMonth, type PlannedSession, planMonth, type ScheduleGroup } from './generate';
import { BOOKING_KINDS, type BookingKind, SESSION_KINDS, type SessionKind } from './labels';
import { type Clash, describeClash, findClashes } from './occupancy';
import {
  type BookingSettings,
  checkCancel,
  checkPractice,
  type RoomInfo,
  type RuleResult,
  type StudentContext,
  settingsFrom,
} from './rules';
import { addDays, at, dayOf, daysOfMonth, mondayOf } from './time';

type Doc = Record<string, unknown> & { id: number };
const all = { limit: 0, pagination: false } as const;

// ── who is asking ───────────────────────────────────────────────────────────

export const isStaff = (user: unknown) => userIsStaffOrAdmin(user);

/** The student's groups that haven't ended, and the productions linked to them. */
export async function studentGroups(payload: Payload, userId: number) {
  const today = dayOf(new Date());
  const { docs: groups } = await payload.find({
    collection: 'courseGroups',
    where: { and: [{ students: { in: [userId] } }, { endDate: { greater_than_equal: `${today}T00:00:00.000Z` } }] },
    depth: 0,
    select: { title: true, startDate: true, endDate: true, info: true, instructors: true },
    ...all,
  });
  const ids = groups.map((g) => g.id);
  const productions = ids.length
    ? (
        await payload.find({
          collection: 'productions',
          where: { courseGroups: { in: ids } },
          draft: true,
          depth: 0,
          select: { title: true, courseGroups: true },
          ...all,
        })
      ).docs
    : [];
  return { groups, productions };
}

export async function loadSettings(payload: Payload): Promise<BookingSettings> {
  return settingsFrom(
    (await payload.findGlobal({ slug: 'roomBookingSettings', depth: 0 })) as unknown as Record<string, unknown>,
  );
}

/** Facts for the student rules, for a booking starting at `start` (excluding `except`). */
export async function studentContext(
  payload: Payload,
  userId: number,
  start: Date,
  except?: number,
): Promise<StudentContext> {
  const { groups, productions } = await studentGroups(payload, userId);
  const monday = mondayOf(dayOf(start));
  const { docs: week } = await payload.find({
    collection: 'roomBookings',
    where: {
      and: [
        { user: { equals: userId } },
        { kind: { equals: 'practice' } },
        { status: { equals: 'confirmed' } },
        { start: { greater_than_equal: at(monday, '00:00').toISOString() } },
        { start: { less_than: at(addDays(monday, 7), '00:00').toISOString() } },
        ...(except ? [{ id: { not_equals: except } }] : []),
      ],
    },
    depth: 0,
    select: { start: true, end: true },
    ...all,
  });
  return {
    activeGroups: groups.map((g) => ({ id: g.id, endDate: dayOf(new Date(g.endDate)) })),
    linkableProductionIds: productions.map((p) => p.id),
    minutesBookedInWeek: week.reduce(
      (sum, b) => sum + (new Date(b.end).getTime() - new Date(b.start).getTime()) / 60_000,
      0,
    ),
  };
}

export async function roomsById(payload: Payload, ids?: number[]): Promise<RoomInfo[] & { color?: string }[]> {
  const { docs } = await payload.find({
    collection: 'rooms',
    where: ids?.length ? { id: { in: ids } } : undefined,
    depth: 0,
    sort: 'order',
    ...all,
  });
  return docs.map((r) => ({
    id: r.id,
    name: r.name,
    active: Boolean(r.active),
    studentBookable: Boolean(r.studentBookable),
    color: r.color,
  }));
}

// ── the schedule ────────────────────────────────────────────────────────────

export type ScheduleEvent = {
  id: string;
  bookingId: number;
  sessionId?: number;
  kind: BookingKind;
  sessionKind?: SessionKind;
  /** What is happening: the session's title, the rental's, or "Gyakorlás — Név". */
  title: string;
  start: string;
  end: string;
  roomIds: number[];
  /** The course group or production it belongs to ("Mihez gyakorol" for practice). */
  owner?: { type: 'courseGroup' | 'production'; id: number; title: string };
  /** For practice: who booked it. */
  booker?: string;
  own: boolean;
  /** The booker's own note — only for the booker and staff. */
  note?: string;
};

/**
 * Everything in the given rooms and range, for staff and active students (null for anyone else).
 * Staff notes are never included.
 */
export async function getRoomSchedule(
  payload: Payload,
  viewer: TypedUser | null,
  roomIds: number[] | null,
  from: Date,
  to: Date,
): Promise<ScheduleEvent[] | null> {
  if (!viewer) return null;
  const staff = isStaff(viewer);
  if (!staff && !(await studentGroups(payload, viewer.id)).groups.length) return null;

  const { docs } = await payload.find({
    collection: 'roomBookings',
    where: {
      and: [
        { status: { equals: 'confirmed' } },
        { start: { less_than: to.toISOString() } },
        { end: { greater_than: from.toISOString() } },
        ...(roomIds?.length ? [{ rooms: { in: roomIds } }] : []),
      ],
    },
    depth: 2,
    select: {
      displayTitle: true,
      kind: true,
      start: true,
      end: true,
      rooms: true,
      user: true,
      session: true,
      courseGroup: true,
      production: true,
      note: true,
    },
    populate: {
      users: { name: true },
      sessions: { displayTitle: true, kind: true, courseGroup: true, production: true },
      courseGroups: { title: true },
      productions: { title: true },
    },
    sort: 'start',
    ...all,
  });

  const ownerOf = (group: unknown, production: unknown): ScheduleEvent['owner'] => {
    if (group && typeof group === 'object')
      return { type: 'courseGroup', id: (group as Doc).id, title: String((group as Doc).title ?? '') };
    if (production && typeof production === 'object')
      return { type: 'production', id: (production as Doc).id, title: String((production as Doc).title ?? '') };
    return undefined;
  };
  return docs.map((b) => {
    const session = b.session && typeof b.session === 'object' ? (b.session as unknown as Doc) : null;
    const user = b.user && typeof b.user === 'object' ? (b.user as unknown as Doc) : null;
    const own = Boolean(user && user.id === viewer.id);
    return {
      id: `b${b.id}`,
      bookingId: b.id,
      sessionId: session?.id,
      kind: b.kind as BookingKind,
      sessionKind: session?.kind as SessionKind | undefined,
      title: String(session?.displayTitle ?? b.displayTitle ?? BOOKING_KINDS[b.kind as BookingKind]),
      start: String(b.start),
      end: String(b.end),
      roomIds: relIds(b.rooms),
      owner: session ? ownerOf(session.courseGroup, session.production) : ownerOf(b.courseGroup, b.production),
      booker: b.kind === 'practice' ? String(user?.name ?? '') : undefined,
      own,
      note: (own || staff) && b.note ? String(b.note) : undefined,
    };
  });
}

// ── student practice ────────────────────────────────────────────────────────

export type PracticeInput = {
  roomIds: number[];
  start: string;
  end: string;
  courseGroup?: number | null;
  production?: number | null;
  note?: string;
};

export async function bookPractice(
  payload: Payload,
  user: TypedUser,
  input: PracticeInput,
): Promise<RuleResult & { bookingId?: number }> {
  const start = new Date(input.start);
  const end = new Date(input.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return { ok: false, reason: 'Érvénytelen időpont.' };
  const [settings, ctx, rooms] = await Promise.all([
    loadSettings(payload),
    studentContext(payload, user.id, start),
    roomsById(payload, input.roomIds),
  ]);
  if (rooms.length !== new Set(input.roomIds).size) return { ok: false, reason: 'Ismeretlen terem.' };
  const verdict = checkPractice(
    { start, end, rooms, courseGroup: input.courseGroup, production: input.production },
    ctx,
    settings,
    new Date(),
  );
  if (!verdict.ok) return verdict;
  try {
    const booking = await payload.create({
      collection: 'roomBookings',
      data: {
        kind: 'practice',
        user: user.id,
        rooms: input.roomIds,
        start: start.toISOString(),
        end: end.toISOString(),
        courseGroup: input.courseGroup ?? null,
        production: input.production ?? null,
        note: input.note?.trim().slice(0, 500) || null,
        status: 'confirmed',
      },
      overrideAccess: true,
    });
    return { ok: true, bookingId: booking.id };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}

export async function cancelPractice(payload: Payload, user: TypedUser, bookingId: number): Promise<RuleResult> {
  const booking = await payload.findByID({
    collection: 'roomBookings',
    id: bookingId,
    depth: 0,
    disableErrors: true,
    overrideAccess: true,
  });
  if (booking?.kind !== 'practice' || relId(booking.user) !== user.id)
    return { ok: false, reason: 'Nincs ilyen foglalásod.' };
  if (booking.status === 'cancelled') return { ok: true };
  const verdict = checkCancel(new Date(booking.start), await loadSettings(payload), new Date());
  if (!verdict.ok) return verdict;
  await payload.update({
    collection: 'roomBookings',
    id: bookingId,
    data: { status: 'cancelled', cancelledBy: user.id, cancelReason: 'A foglaló lemondta.' },
    overrideAccess: true,
  });
  return { ok: true };
}

/** A Payload error → its first message (validation messages are already Hungarian). */
export function errorMessage(err: unknown): string {
  const e = err as { data?: { errors?: { message?: string }[] }; message?: string };
  return e.data?.errors?.[0]?.message ?? e.message ?? 'Ismeretlen hiba.';
}

// ── fill month ──────────────────────────────────────────────────────────────

export type FillPreviewItem = {
  /** "groupId:entry:day" — what to tick to create it. */
  key: string;
  title: string;
  day: string;
  start: string;
  end: string;
  rooms: string[];
  /** What it would clash with (then it is created without a place). */
  clashes: string[];
};

async function scheduleGroups(payload: Payload, ids: number[] | null): Promise<ScheduleGroup[]> {
  const { docs } = await payload.find({
    collection: 'courseGroups',
    where: ids?.length ? { id: { in: ids } } : undefined,
    depth: 0,
    // no `select` here: with it, Payload 3.90 returns the schedule rows without their rooms
    // (relationships nested in an array field)
    ...all,
  });
  return docs.map((g) => ({
    id: g.id,
    title: g.title,
    startDate: dayOf(new Date(g.startDate)),
    endDate: dayOf(new Date(g.endDate)),
    schedule: (g.defaultSchedule ?? []).map((e) => ({
      weekday: Number(e.weekday),
      startTime: e.startTime,
      endTime: e.endTime,
      rooms: relIds(e.rooms),
    })),
  }));
}

/** What fill month would create for the month (and which would end up without a place). */
export async function planFill(payload: Payload, year: number, month: number, groupIds: number[] | null) {
  const groups = groupIds?.length
    ? await scheduleGroups(payload, groupIds)
    : groupsInMonth(await scheduleGroups(payload, null), year, month);
  const ids = groups.map((g) => g.id);
  const days = daysOfMonth(year, month);
  const { docs: generated } = ids.length
    ? await payload.find({
        collection: 'sessions',
        where: {
          and: [
            { 'generatedFrom.courseGroup': { in: ids } },
            { 'generatedFrom.day': { greater_than_equal: days[0] } },
            { 'generatedFrom.day': { less_than_equal: days.at(-1) } },
          ],
        },
        depth: 0,
        select: { generatedFrom: true },
        ...all,
      })
    : { docs: [] };
  const existing = new Set(
    generated.map((s) =>
      generatedKey(
        relId(s.generatedFrom?.courseGroup) ?? 0,
        Number(s.generatedFrom?.entry),
        String(s.generatedFrom?.day),
      ),
    ),
  );
  const settings = await loadSettings(payload);
  const planned = planMonth({ year, month, groups, closedDays: settings.closedDays, existing });
  return { groups, planned };
}

export async function previewFill(payload: Payload, year: number, month: number, groupIds: number[] | null) {
  const { groups, planned } = await planFill(payload, year, month, groupIds);
  const roomNames = new Map((await roomsById(payload)).map((r) => [r.id, r.name]));
  // planned sessions can also clash with each other (two groups, same room and time)
  const taken: PlannedSession[] = [];
  const items: FillPreviewItem[] = [];
  for (const p of planned) {
    const clashes: string[] = (await findClashes(payload, undefined, p.rooms, p.start, p.end)).map(describeClash);
    for (const t of taken) {
      if (t.start < p.end && p.start < t.end && t.rooms.some((r) => p.rooms.includes(r))) {
        clashes.push(
          `${p.rooms
            .filter((r) => t.rooms.includes(r))
            .map((r) => roomNames.get(r))
            .join(', ')}: ${t.title} (ugyanebben a feltöltésben)`,
        );
      }
    }
    if (!clashes.length) taken.push(p);
    items.push({
      key: generatedKey(p.courseGroup, p.entry, p.day),
      title: p.title,
      day: p.day,
      start: p.start.toISOString(),
      end: p.end.toISOString(),
      rooms: p.rooms.map((r) => roomNames.get(r) ?? String(r)),
      clashes,
    });
  }
  return { groups: groups.map((g) => ({ id: g.id, title: g.title })), items };
}

/** Creates the planned sessions — or only the ticked ones (`keys`) — with bookings where the rooms are free. No e-mails. */
export async function applyFill(
  payload: Payload,
  user: TypedUser,
  year: number,
  month: number,
  groupIds: number[] | null,
  keys?: string[],
) {
  const wanted = keys ? new Set(keys) : null;
  const planned = (await planFill(payload, year, month, groupIds)).planned.filter(
    (p) => !wanted || wanted.has(generatedKey(p.courseGroup, p.entry, p.day)),
  );
  let placed = 0;
  const unplaced: { title: string; day: string; start: string; clashes: string[] }[] = [];
  for (const p of planned) {
    const session = await payload.create({
      collection: 'sessions',
      data: {
        kind: 'course',
        courseGroup: p.courseGroup,
        start: p.start.toISOString(),
        end: p.end.toISOString(),
        locationType: 'room',
        rooms: p.rooms,
        status: 'scheduled',
        generatedFrom: { courseGroup: p.courseGroup, entry: p.entry, day: p.day },
      },
      user,
      overrideAccess: false,
      context: { generating: true },
    });
    if (session.locationType === 'room') placed++;
    else {
      const clashes = await findClashes(payload, undefined, p.rooms, p.start, p.end);
      unplaced.push({ title: p.title, day: p.day, start: p.start.toISOString(), clashes: clashes.map(describeClash) });
    }
  }
  return { created: planned.length, placed, unplaced };
}

/** The month's generated sessions that "Generált alkalmak törlése" may delete: future, not hand-edited. */
export async function deletableGenerated(payload: Payload, year: number, month: number, groupIds: number[] | null) {
  const days = daysOfMonth(year, month);
  const { docs } = await payload.find({
    collection: 'sessions',
    where: {
      and: [
        { 'generatedFrom.courseGroup': groupIds?.length ? { in: groupIds } : { exists: true } },
        { 'generatedFrom.day': { greater_than_equal: days[0] } },
        { 'generatedFrom.day': { less_than_equal: days.at(-1) } },
        { customized: { not_equals: true } },
        { start: { greater_than: new Date().toISOString() } },
      ],
    },
    depth: 0,
    select: { displayTitle: true, start: true, end: true, locationType: true },
    sort: 'start',
    ...all,
  });
  return docs.map((s) => ({
    id: s.id,
    title: String(s.displayTitle ?? ''),
    start: s.start,
    end: s.end,
    placed: s.locationType === 'room',
  }));
}

/** Deletes them (and their bookings) — or only the ticked ones (`ids`, still checked here). */
export async function deleteGenerated(
  payload: Payload,
  user: TypedUser,
  year: number,
  month: number,
  groupIds: number[] | null,
  ids?: number[],
) {
  const wanted = ids ? new Set(ids) : null;
  const docs = (await deletableGenerated(payload, year, month, groupIds)).filter((d) => !wanted || wanted.has(d.id));
  for (const s of docs) await payload.delete({ collection: 'sessions', id: s.id, user, overrideAccess: false });
  return { deleted: docs.length };
}

// ── staff: sessions without a place ─────────────────────────────────────────

export async function unplacedSessions(payload: Payload, from: Date, to: Date) {
  const { docs } = await payload.find({
    collection: 'sessions',
    where: {
      and: [
        { locationType: { equals: 'unplaced' } },
        { status: { equals: 'scheduled' } },
        { start: { less_than: to.toISOString() } },
        { end: { greater_than: from.toISOString() } },
      ],
    },
    depth: 0,
    select: {
      displayTitle: true,
      kind: true,
      start: true,
      end: true,
      rooms: true,
      courseGroup: true,
      production: true,
    },
    sort: 'start',
    ...all,
  });
  return docs.map((s) => ({
    id: s.id,
    title: s.displayTitle ?? SESSION_KINDS[s.kind as SessionKind],
    kind: s.kind as SessionKind,
    start: s.start,
    end: s.end,
    roomIds: relIds(s.rooms),
  }));
}

export const countUnplaced = async (payload: Payload) =>
  (
    await payload.count({
      collection: 'sessions',
      where: {
        and: [
          { locationType: { equals: 'unplaced' } },
          { status: { equals: 'scheduled' } },
          { start: { greater_than: new Date().toISOString() } },
        ],
      },
    })
  ).totalDocs;

export type { Clash };
export { userIsAdmin };
