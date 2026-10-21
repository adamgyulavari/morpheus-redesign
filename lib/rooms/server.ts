/**
 * Room-calendar server logic (no 'use server' here — see student-actions.ts and admin-actions.ts).
 * Everything goes through the Payload Local API; room data is staff-only in the API, so student
 * reads and writes happen here, after these checks, never through the raw API.
 */

import type { Payload, TypedUser, Where } from 'payload';
import { cache } from 'react';
import { applicationSettings } from '@/lib/applications/settings';
import { todayInBudapest } from '@/lib/dates';
import { userIsStaffOrAdmin } from '@/payload/access';
import { relId, relIds } from '@/payload/rel';
import type { Session } from '@/payload-types';
import {
  generatedKey,
  groupsInMonth,
  type PlannedWorkshop,
  planMonth,
  planWorkshops,
  type ScheduleGroup,
  type WorkshopPlan,
} from './generate';
import { BOOKING_KINDS, type BookingKind, SESSION_KINDS, type SessionKind } from './labels';
import { describeClash, findClashes } from './occupancy';
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

/** The student's groups that haven't ended, and the productions linked to them. */
export async function studentGroups(payload: Payload, userId: number) {
  const today = todayInBudapest();
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

/** May book rooms: only those staff allowed it (`users.roomBooking`) — being in a course doesn't. */
export const mayBookRooms = (user: TypedUser | null | undefined): boolean => Boolean(user?.roomBooking);

/** Facts for the student rules, for a booking starting at `start` (excluding `except`). */
export async function studentContext(
  payload: Payload,
  user: TypedUser,
  start: Date,
  except?: number,
): Promise<StudentContext> {
  const userId = user.id;
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
    permitted: mayBookRooms(user),
    groupIds: groups.map((g) => g.id),
    linkableProductionIds: productions.map((p) => p.id),
    minutesBookedInWeek: week.reduce(
      (sum, b) => sum + (new Date(b.end).getTime() - new Date(b.start).getTime()) / 60_000,
      0,
    ),
  };
}

export async function roomsById(payload: Payload, ids?: number[]): Promise<(RoomInfo & { color?: string })[]> {
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
 * Everything in the range, for staff and those who may book rooms (null for anyone else).
 * Staff notes are never included.
 */
export async function getRoomSchedule(
  payload: Payload,
  viewer: TypedUser | null,
  from: Date,
  to: Date,
): Promise<ScheduleEvent[] | null> {
  if (!viewer) return null;
  const staff = userIsStaffOrAdmin(viewer);
  if (!staff && !mayBookRooms(viewer)) return null;

  const { docs } = await payload.find({
    collection: 'roomBookings',
    where: {
      and: [
        { status: { equals: 'confirmed' } },
        { start: { less_than: to.toISOString() } },
        { end: { greater_than: from.toISOString() } },
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
    studentContext(payload, user, start),
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
  /** "groupId:entry:day", or "workshop:day" — what to tick to create it. */
  key: string;
  title: string;
  day: string;
  start: string;
  end: string;
  rooms: string[];
  /** What it would clash with (then it is created without a place). */
  clashes: string[];
};

/** Nyitott Műhely in the fill: day, time and rooms from the dialog; price and size from Nyitott Műhely jelentkezési beállítások. */
export type WorkshopFill = WorkshopPlan;

const WORKSHOP_TITLE = SESSION_KINDS.workshop;
const workshopKey = (day: string) => `workshop:${day}`;

/** The month's days, as a condition on what fill month made. */
const generatedInMonth = (year: number, month: number): Where[] => {
  const days = daysOfMonth(year, month);
  return [
    { 'generatedFrom.day': { greater_than_equal: days[0] } },
    { 'generatedFrom.day': { less_than_equal: days.at(-1) } },
  ];
};

async function scheduleGroups(payload: Payload, ids: number[] | null): Promise<ScheduleGroup[]> {
  if (ids && !ids.length) return [];
  const { docs } = await payload.find({
    collection: 'courseGroups',
    where: ids ? { id: { in: ids } } : undefined,
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

/** The groups running in the month, the Nyitott Műhely defaults and the rooms (for the month dialog's first step). */
export async function monthGroups(payload: Payload, year: number, month: number) {
  const { weekday, startTime, endTime, rooms } = (await applicationSettings(payload)).workshopDefaults;
  return {
    groups: groupsInMonth(await scheduleGroups(payload, null), year, month).map((g) => ({ id: g.id, title: g.title })),
    workshop: { weekday, startTime, endTime, rooms },
    rooms: (await roomsById(payload)).filter((r) => r.active).map((r) => ({ id: r.id, name: r.name })),
  };
}

/**
 * What fill month would create for the month: the groups' sessions (`groupIds`; null: every group
 * running then) and, with `workshop`, the Nyitott Műhely dates.
 */
export async function planFill(
  payload: Payload,
  year: number,
  month: number,
  groupIds: number[] | null,
  workshop: WorkshopFill | null = null,
) {
  const groups = groupIds
    ? await scheduleGroups(payload, groupIds)
    : groupsInMonth(await scheduleGroups(payload, null), year, month);
  const ids = groups.map((g) => g.id);
  const { docs: generated } = ids.length
    ? await payload.find({
        collection: 'sessions',
        where: { and: [{ 'generatedFrom.courseGroup': { in: ids } }, ...generatedInMonth(year, month)] },
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
  return { groups, planned, workshops: await planWorkshopFill(payload, year, month, workshop, settings.closedDays) };
}

/** Nyitott Műhely dates: one a week from the first day; a day that already has one (made by hand too) is skipped. */
async function planWorkshopFill(
  payload: Payload,
  year: number,
  month: number,
  workshop: WorkshopFill | null,
  closedDays: string[],
): Promise<PlannedWorkshop[]> {
  if (!workshop) return [];
  const days = daysOfMonth(year, month);
  const { docs } = await payload.find({
    collection: 'sessions',
    where: {
      and: [
        { kind: { equals: 'workshop' } },
        { start: { greater_than_equal: at(days[0] ?? '', '00:00').toISOString() } },
        { start: { less_than: at(addDays(days.at(-1) ?? '', 1), '00:00').toISOString() } },
      ],
    },
    depth: 0,
    select: { start: true },
    ...all,
  });
  return planWorkshops({
    year,
    month,
    plan: workshop,
    closedDays,
    existingDays: new Set(docs.map((s) => dayOf(new Date(s.start)))),
  });
}

export async function previewFill(
  payload: Payload,
  year: number,
  month: number,
  groupIds: number[] | null,
  workshop: WorkshopFill | null = null,
) {
  const { groups, planned, workshops } = await planFill(payload, year, month, groupIds, workshop);
  const roomNames = new Map((await roomsById(payload)).map((r) => [r.id, r.name]));
  const sorted = [
    ...planned.map((p) => ({ ...p, key: generatedKey(p.courseGroup, p.entry, p.day) })),
    ...workshops.map((w) => ({ ...w, key: workshopKey(w.day), title: WORKSHOP_TITLE })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title, 'hu'));
  // planned sessions can also clash with each other (two groups, same room and time)
  const taken: typeof sorted = [];
  const items: FillPreviewItem[] = [];
  for (const p of sorted) {
    const clashes: string[] = p.rooms.length
      ? (await findClashes(payload, undefined, p.rooms, p.start, p.end)).map(describeClash)
      : [];
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
      key: p.key,
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
  workshop: WorkshopFill | null = null,
) {
  const wanted = keys ? new Set(keys) : null;
  const plan = await planFill(payload, year, month, groupIds, workshop);
  const planned = plan.planned.filter((p) => !wanted || wanted.has(generatedKey(p.courseGroup, p.entry, p.day)));
  const workshops = plan.workshops.filter((w) => !wanted || wanted.has(workshopKey(w.day)));
  const defaults = workshops.length ? (await applicationSettings(payload)).workshopDefaults : null;
  let placed = 0;
  const unplaced: { title: string; day: string; start: string; clashes: string[] }[] = [];
  const create = async (
    title: string,
    p: { day: string; start: Date; end: Date; rooms: number[] },
    data: Partial<Session>,
  ) => {
    const session = await payload.create({
      collection: 'sessions',
      data: {
        start: p.start.toISOString(),
        end: p.end.toISOString(),
        locationType: p.rooms.length ? 'room' : 'unplaced',
        rooms: p.rooms,
        status: 'scheduled',
        ...data,
      } as Session,
      user,
      overrideAccess: false,
      context: { generating: true },
    });
    if (session.locationType === 'room') placed++;
    else {
      const clashes = p.rooms.length ? await findClashes(payload, undefined, p.rooms, p.start, p.end) : [];
      unplaced.push({ title, day: p.day, start: p.start.toISOString(), clashes: clashes.map(describeClash) });
    }
  };
  for (const p of planned) {
    await create(p.title, p, {
      kind: 'course',
      courseGroup: p.courseGroup,
      generatedFrom: { courseGroup: p.courseGroup, entry: p.entry, day: p.day },
    });
  }
  for (const w of workshops) {
    await create(WORKSHOP_TITLE, w, {
      kind: 'workshop',
      generatedFrom: { day: w.day },
      workshop: {
        price: defaults?.price,
        minParticipants: defaults?.minParticipants,
        maxParticipants: defaults?.maxParticipants,
        bookable: true,
        workshopStatus: 'open',
      },
    });
  }
  return { created: planned.length + workshops.length, placed, unplaced };
}

/**
 * The month's generated sessions that "Generált alkalmak törlése" may delete: future, not
 * hand-edited — of the groups (null: any group) and, with `workshops`, the generated Nyitott Műhely
 * dates nobody has signed up for.
 */
export async function deletableGenerated(
  payload: Payload,
  year: number,
  month: number,
  groupIds: number[] | null,
  workshops = false,
) {
  const scopes: Where[] = [];
  if (!groupIds || groupIds.length)
    scopes.push({ 'generatedFrom.courseGroup': groupIds ? { in: groupIds } : { exists: true } });
  if (workshops) scopes.push({ kind: { equals: 'workshop' } });
  if (!scopes.length) return [];
  const { docs } = await payload.find({
    collection: 'sessions',
    where: {
      and: [
        { or: scopes },
        ...generatedInMonth(year, month),
        { customized: { not_equals: true } },
        { start: { greater_than: new Date().toISOString() } },
      ],
    },
    depth: 0,
    select: { displayTitle: true, kind: true, start: true, end: true, locationType: true },
    sort: 'start',
    ...all,
  });
  const workshopIds = docs.filter((s) => s.kind === 'workshop').map((s) => s.id);
  const signedUp = workshopIds.length
    ? new Set(
        (
          await payload.find({
            collection: 'applications',
            where: { session: { in: workshopIds } },
            depth: 0,
            select: { session: true },
            ...all,
          })
        ).docs.map((a) => relId(a.session)),
      )
    : new Set<number | null>();
  return docs
    .filter((s) => !signedUp.has(s.id))
    .map((s) => ({
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
  workshops = false,
) {
  const wanted = ids ? new Set(ids) : null;
  const docs = (await deletableGenerated(payload, year, month, groupIds, workshops)).filter(
    (d) => !wanted || wanted.has(d.id),
  );
  for (const s of docs) await payload.delete({ collection: 'sessions', id: s.id, user, overrideAccess: false });
  return { deleted: docs.length };
}

// ── staff: sessions without a place ─────────────────────────────────────────

/** Sessions that will happen but have no place yet. */
const UNPLACED: Where[] = [{ locationType: { equals: 'unplaced' } }, { status: { equals: 'scheduled' } }];

export async function unplacedSessions(payload: Payload, from: Date, to: Date) {
  const { docs } = await payload.find({
    collection: 'sessions',
    where: {
      and: [...UNPLACED, { start: { less_than: to.toISOString() } }, { end: { greater_than: from.toISOString() } }],
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

/** (Once per render: the sidebar and the admin home both ask.) */
export const countUnplaced = cache(
  async (payload: Payload) =>
    (
      await payload.count({
        collection: 'sessions',
        where: { and: [...UNPLACED, { start: { greater_than: new Date().toISOString() } }] },
      })
    ).totalDocs,
);
