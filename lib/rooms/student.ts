/**
 * What a student sees in /fiokom: their active groups, the upcoming sessions of those groups and of
 * the productions linked to them, their groupmates' practice, their links and their own bookings.
 * Read on the server for this user only (room data isn't readable through the API by students);
 * staff notes are never included.
 */
import type { Payload, TypedUser } from 'payload';

import { relId, relIds } from '@/payload/rel';

import type { SessionKind } from './labels';
import { canBookRooms, studentGroups } from './server';

const all = { limit: 0, pagination: false } as const;

export type OverviewSession = {
  id: number;
  title: string;
  kind: SessionKind;
  start: string;
  end: string;
  status: 'scheduled' | 'cancelled';
  /** Room names, or the external place. */
  place?: string;
};

export type OverviewPractice = {
  id: number;
  start: string;
  end: string;
  rooms: string;
  booker: string;
  owner?: string;
  note?: string;
};

export async function studentOverview(payload: Payload, user: TypedUser) {
  const { groups, productions } = await studentGroups(payload, user.id);
  const groupIds = groups.map((g) => g.id);
  const productionIds = productions.map((p) => p.id);
  const now = new Date().toISOString();

  const [rooms, instructors, sessions, practice, links] = await Promise.all([
    payload.find({ collection: 'rooms', depth: 0, select: { name: true }, ...all }),
    payload.find({
      collection: 'users',
      where: { id: { in: groups.flatMap((g) => relIds(g.instructors)) } },
      depth: 0,
      select: { name: true },
      ...all,
    }),
    groupIds.length
      ? payload.find({
          collection: 'sessions',
          where: {
            and: [
              { end: { greater_than: now } },
              {
                or: [
                  { courseGroup: { in: groupIds } },
                  ...(productionIds.length ? [{ production: { in: productionIds } }] : []),
                ],
              },
            ],
          },
          depth: 0,
          select: {
            displayTitle: true,
            kind: true,
            start: true,
            end: true,
            status: true,
            locationType: true,
            rooms: true,
            externalLocation: true,
          },
          sort: 'start',
          limit: 40,
        })
      : null,
    // my own bookings always (also without a course, with the permission); my groupmates' with a group
    payload.find({
      collection: 'roomBookings',
      where: {
        and: [
          { kind: { equals: 'practice' } },
          { status: { equals: 'confirmed' } },
          { end: { greater_than: now } },
          {
            or: [
              { user: { equals: user.id } },
              ...(groupIds.length ? [{ courseGroup: { in: groupIds } }] : []),
              ...(productionIds.length ? [{ production: { in: productionIds } }] : []),
            ],
          },
        ],
      },
      depth: 1,
      select: { start: true, end: true, rooms: true, user: true, courseGroup: true, production: true, note: true },
      populate: {
        users: { name: true },
        courseGroups: { title: true },
        productions: { title: true },
        rooms: { name: true },
      },
      sort: 'start',
      limit: 60,
    }),
    groupIds.length
      ? payload.find({
          collection: 'studentLinks',
          where: {
            and: [
              { active: { equals: true } },
              { or: [{ audience: { equals: 'all' } }, { courseGroups: { in: groupIds } }] },
            ],
          },
          depth: 0,
          select: { title: true, url: true, description: true },
          sort: 'order',
          ...all,
        })
      : null,
  ]);

  const roomName = new Map(rooms.docs.map((r) => [r.id, r.name]));
  const instructorName = new Map(instructors.docs.map((u) => [u.id, u.name ?? '']));
  const titleOf = (v: unknown) =>
    v && typeof v === 'object' ? String((v as { title?: string }).title ?? '') : undefined;

  const toPractice = (b: NonNullable<typeof practice>['docs'][number]): OverviewPractice => ({
    id: b.id,
    start: b.start,
    end: b.end,
    rooms: relIds(b.rooms)
      .map((id) => roomName.get(id))
      .filter(Boolean)
      .join(', '),
    booker: b.user && typeof b.user === 'object' ? String(b.user.name ?? '') : '',
    owner: titleOf(b.courseGroup) || titleOf(b.production) || undefined,
    note: relId(b.user) === user.id && b.note ? b.note : undefined,
  });
  const allPractice = practice?.docs ?? [];

  return {
    active: groups.length > 0,
    /** May book rooms: an active group, or staff's permission. */
    mayBook: canBookRooms(user, groups.length),
    groups: groups.map((g) => ({
      id: g.id,
      title: g.title,
      startDate: g.startDate,
      endDate: g.endDate,
      info: g.info,
      instructors: relIds(g.instructors)
        .map((id) => instructorName.get(id))
        .filter(Boolean) as string[],
    })),
    productions: productions.map((p) => ({ id: p.id, title: p.title })),
    sessions: (sessions?.docs ?? []).map(
      (s): OverviewSession => ({
        id: s.id,
        title: s.displayTitle ?? '',
        kind: s.kind as SessionKind,
        start: s.start,
        end: s.end,
        status: s.status as OverviewSession['status'],
        place:
          s.locationType === 'room'
            ? relIds(s.rooms)
                .map((id) => roomName.get(id))
                .filter(Boolean)
                .join(', ')
            : s.locationType === 'external'
              ? (s.externalLocation ?? undefined)
              : undefined,
      }),
    ),
    ownPractice: allPractice.filter((b) => relId(b.user) === user.id).map(toPractice),
    groupPractice: allPractice.filter((b) => relId(b.user) !== user.id).map(toPractice),
    links: (links?.docs ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      description: l.description ?? undefined,
    })),
  };
}

export type StudentOverview = Awaited<ReturnType<typeof studentOverview>>;
