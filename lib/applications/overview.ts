/**
 * The person's applications for the /fiokom overview: their Nyitott Műhely dates (for "Közelgő
 * alkalmak", with cancel / move where allowed) and their pending course applications (for
 * "Kurzusaim"). Read on the server for this user only.
 */
import type { Payload, TypedUser } from 'payload';

import { dateRange, monthDayShort, weekday } from '@/lib/dates';
import { clockOf, dayOf } from '@/lib/rooms/time';
import { relIds } from '@/payload/rel';
import type { CourseGroup, Session } from '@/payload-types';

import { REVIEW_STATUSES } from './labels';
import { allowedActions, upcomingWorkshops } from './server';
import { applicationSettings } from './settings';

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

export type MyPending = {
  applicationId: number;
  kind: 'beginner' | 'professional';
  title: string;
  when?: string;
  /** "Jelentkezés elküldve", "Interjú"… */
  status: string;
  canCancel: boolean;
};

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
  const rooms = await payload.find({
    collection: 'rooms',
    depth: 0,
    select: { name: true },
    limit: 0,
    pagination: false,
  });
  const roomName = new Map(rooms.docs.map((r) => [r.id, r.name]));
  const placeOf = (s: Session) =>
    s.locationType === 'room'
      ? relIds(s.rooms)
          .map((id) => roomName.get(id))
          .filter(Boolean)
          .join(', ') || undefined
      : s.locationType === 'external'
        ? (s.externalLocation ?? undefined)
        : undefined;

  const workshops: MyWorkshop[] = [];
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
        place: placeOf(s),
        cancelled: a.status === 'cancelled' || s.status === 'cancelled',
        canCancel: actions.cancel.ok,
        canMove: actions.move,
      });
      continue;
    }
    const g = typeof a.courseGroup === 'object' ? (a.courseGroup as CourseGroup | null) : null;
    // admitted (in the group): the group itself is in "Kurzusaim"
    if (g && activeGroupIds.includes(g.id)) continue;
    if (a.kind === 'beginner' && a.status !== 'registered') continue;
    const actions = await allowedActions(payload, a, settings, now);
    pending.push({
      applicationId: a.id,
      kind: a.kind,
      title: g?.title ?? 'Szakmai kurzus',
      when: g ? dateRange(dayOf(new Date(g.startDate)), dayOf(new Date(g.endDate))) : undefined,
      status:
        a.kind === 'professional' && a.status === 'interview' ? REVIEW_STATUSES.interview : 'Jelentkezés elküldve',
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

  return { workshops, pending, moveTargets };
}

export type MyApplications = Awaited<ReturnType<typeof myApplications>>;
