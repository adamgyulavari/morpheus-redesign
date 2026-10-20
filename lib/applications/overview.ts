/**
 * The person's applications for the /fiokom overview: their Nyitott Műhely dates and show
 * bookings (for "Közelgő alkalmak", with cancel / move where allowed) and their pending course
 * applications (for "Kurzusaim"). Read on the server for this user only.
 */
import type { Payload, TypedUser } from 'payload';

import { dateRange, monthDayShort, weekday } from '@/lib/dates';
import { placeText } from '@/lib/rooms/format';
import { roomNameMap } from '@/lib/rooms/occupancy';
import { clockOf, dayOf } from '@/lib/rooms/time';
import { relId } from '@/payload/rel';
import type { Course, CourseGroup } from '@/payload-types';

import { REVIEW_STATUSES } from './labels';
import { allowedActions, upcomingWorkshops } from './server';
import { applicationSettings } from './settings';
import { showStart } from './shows';

export type MyWorkshop = {
  applicationId: number;
  sessionId: number;
  title: string;
  start: string;
  end: string;
  place?: string;
  /** The date was cancelled (too few people): shown as "Elmarad", with "Áthelyezés". */
  cancelled: boolean;
  canCancel: boolean;
  canMove: boolean;
};

export type MyShow = {
  applicationId: number;
  /** Its tickets' link (/fiokom/jegyek/<uid>). */
  uid: string;
  /** The production. */
  title: string;
  seats: number;
  start: string;
  place?: string;
  /** A free booking, before the show (a paid ticket only through staff). */
  canCancel: boolean;
};

export type MyPending = {
  applicationId: number;
  kind: 'beginner' | 'professional';
  title: string;
  when?: string;
  /** "Jelentkezés elküldve", "Interjú"… */
  status: string;
  canCancel: boolean;
};

/** id → title (productions) or short name (venues). */
async function titles(payload: Payload, collection: 'productions' | 'venues', ids: (number | null)[]) {
  const list = [...new Set(ids.filter((id): id is number => Boolean(id)))];
  if (!list.length) return new Map<number, string>();
  const { docs } = await payload.find({
    collection,
    where: { id: { in: list } },
    depth: 0,
    limit: 0,
    pagination: false,
    ...(collection === 'productions' ? { draft: true } : {}),
  });
  return new Map(docs.map((d) => [d.id, 'title' in d ? d.title : d.shortName]));
}

export async function myApplications(payload: Payload, user: TypedUser, activeGroupIds: number[], now = new Date()) {
  const settings = await applicationSettings(payload);
  const { docs } = await payload.find({
    collection: 'applications',
    where: {
      and: [
        { user: { equals: user.id } },
        {
          or: [
            { status: { in: ['registered', 'new', 'interview'] } },
            // a date cancelled for too few people: still offered to move
            { and: [{ status: { equals: 'cancelled' } }, { cancelReason: { equals: 'minimum nem teljesült' } }] },
          ],
        },
      ],
    },
    depth: 1,
    sort: '-createdAt',
    limit: 100,
  });
  const roomName = await roomNameMap(payload);
  // the shows' productions and venues (the applications come at depth 1)
  const booked = docs.flatMap((a) => (a.kind === 'show' && typeof a.show === 'object' && a.show ? [a.show] : []));
  const [productions, venues] = await Promise.all([
    titles(
      payload,
      'productions',
      booked.map((s) => relId(s.production)),
    ),
    titles(
      payload,
      'venues',
      booked.map((s) => relId(s.venue)),
    ),
  ]);

  const workshops: MyWorkshop[] = [];
  const shows: MyShow[] = [];
  const pending: MyPending[] = [];
  for (const a of docs) {
    if (a.kind === 'workshop') {
      const s = typeof a.session === 'object' ? a.session : null;
      if (!s || new Date(s.end) <= now) continue;
      const actions = await allowedActions(payload, a, settings, now);
      workshops.push({
        applicationId: a.id,
        sessionId: s.id,
        title: s.title || 'Nyitott Műhely',
        start: s.start,
        end: s.end,
        place: placeText(s, roomName),
        cancelled: a.status === 'cancelled' || s.status === 'cancelled',
        canCancel: actions.cancel.ok,
        canMove: actions.move,
      });
      continue;
    }
    const g = typeof a.courseGroup === 'object' ? (a.courseGroup as CourseGroup | null) : null;
    const course = typeof a.course === 'object' ? (a.course as Course | null) : null;
    // admitted (in the group): the group itself is in "Kurzusaim"
    if (g && activeGroupIds.includes(g.id)) continue;
    if (a.kind === 'show') {
      const s = typeof a.show === 'object' ? a.show : null;
      if (!s || a.status !== 'registered') continue;
      const start = showStart(s);
      if (start <= now) continue;
      shows.push({
        applicationId: a.id,
        uid: a.uid ?? '',
        title: productions.get(relId(s.production) ?? 0) ?? s.title ?? '',
        seats: a.seats ?? 1,
        start: start.toISOString(),
        place: venues.get(relId(s.venue) ?? 0),
        canCancel: (await allowedActions(payload, a, settings, now)).cancel.ok,
      });
      continue;
    }
    if (a.kind === 'beginner' && a.status !== 'registered') continue;
    const actions = await allowedActions(payload, a, settings, now);
    pending.push({
      applicationId: a.id,
      kind: a.kind,
      title: g?.title ?? course?.title ?? 'Szakmai kurzus',
      when: g ? dateRange(dayOf(new Date(g.startDate)), dayOf(new Date(g.endDate))) : undefined,
      status:
        a.kind === 'professional' && a.status === 'interview'
          ? REVIEW_STATUSES.interview
          : g
            ? 'Jelentkezés elküldve'
            : 'Csoportbeosztásra vár',
      canCancel: actions.cancel.ok,
    });
  }

  // dates a participant could move to
  const moveTargets = workshops.some((w) => w.canMove)
    ? (await upcomingWorkshops(payload, now))
        .filter((w) => w.state.state === 'open' || w.state.state === 'confirmed')
        .filter((w) => !workshops.some((m) => m.sessionId === w.id && !m.cancelled))
        .map((w) => ({
          id: w.id,
          label: `${monthDayShort(dayOf(new Date(w.start)))}, ${weekday(dayOf(new Date(w.start)))} · ${clockOf(new Date(w.start))}–${clockOf(new Date(w.end))}`,
        }))
    : [];

  return { workshops, shows, pending, moveTargets };
}

export type MyApplications = Awaited<ReturnType<typeof myApplications>>;
