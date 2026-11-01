/**
 * What a student sees in /fiokom: their groups (ongoing and past), the upcoming sessions of the
 * ongoing ones and of the productions linked to any of them, their groupmates' practice, their links
 * and their own bookings.
 * Read on the server for this user only (room data isn't readable through the API by students);
 * staff notes are never included.
 */
import { createHmac } from 'node:crypto';
import type { Payload, TypedUser } from 'payload';

import { img } from '@/lib/cms-map';
import type { ImageRef } from '@/lib/types';
import { relId, relIds } from '@/payload/rel';

import { placeText } from './format';
import type { SessionKind } from './labels';
import { mayBookRooms, studentGroups } from './server';

const all = { limit: 0, pagination: false } as const;

export type OverviewSession = {
  id: number;
  /** Its handle in the "Naptárba" link: opaque, not the sequential id. */
  ref: string;
  title: string;
  kind: SessionKind;
  start: string;
  end: string;
  status: 'scheduled' | 'cancelled';
  /** Room names, or the external place. */
  place?: string;
};

/** A show one of my groups plays: published or still in the making (then without a link). */
export type OverviewProduction = { id: number; title: string; byline?: string; poster?: ImageRef; href?: string };

export type OverviewPractice = {
  id: number;
  start: string;
  end: string;
  rooms: string;
  booker: string;
  owner?: string;
  note?: string;
};

/** `since`: the sessions and bookings ending after it (the calendar feed's reaches back); by default now. */
export async function studentOverview(payload: Payload, user: TypedUser, since?: Date) {
  const { groups, past, productions } = await studentGroups(payload, user.id);
  const groupIds = groups.map((g) => g.id);
  const productionIds = productions.map((p) => p.id);
  const now = (since ?? new Date()).toISOString();

  const [rooms, instructors, sessions, practice, links, shows] = await Promise.all([
    payload.find({ collection: 'rooms', depth: 0, select: { name: true }, ...all }),
    payload.find({
      collection: 'users',
      where: { id: { in: groups.flatMap((g) => relIds(g.instructors)) } },
      depth: 0,
      select: { name: true },
      ...all,
    }),
    groupIds.length || productionIds.length
      ? payload.find({
          collection: 'sessions',
          where: {
            and: [
              { end: { greater_than: now } },
              {
                or: [
                  ...(groupIds.length ? [{ courseGroup: { in: groupIds } }] : []),
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
          limit: since ? 500 : 40,
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
      limit: since ? 500 : 60,
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
    myProductions(payload, productionIds),
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
  // a course, not the company or a group made to play a show (an Egyéb one linked to a production)
  const isCourse = (g: { id: number; type: string }) =>
    g.type !== 'tarsulat' && !(g.type === 'egyeb' && productions.some((p) => relIds(p.courseGroups).includes(g.id)));

  return {
    active: groups.length > 0 || productions.length > 0,
    /** May book rooms (staff's permission). */
    mayBook: mayBookRooms(user),
    groups: groups.map((g) => ({
      id: g.id,
      title: g.title,
      course: isCourse(g),
      startDate: g.startDate,
      endDate: g.endDate,
      info: g.info,
      instructors: relIds(g.instructors)
        .map((id) => instructorName.get(id))
        .filter(Boolean) as string[],
    })),
    /** Ended courses, latest first. */
    pastCourses: past
      .filter(isCourse)
      .map((g) => ({ id: g.id, title: g.title, startDate: g.startDate, endDate: g.endDate })),
    /** The shows any of my groups plays (an ended one too), in the repertoire's order. */
    productions: shows,
    sessions: (sessions?.docs ?? []).map(
      (s): OverviewSession => ({
        id: s.id,
        ref: createHmac('sha256', payload.secret).update(`session-${s.id}`).digest('base64url').slice(0, 16),
        title: s.displayTitle ?? '',
        kind: s.kind as SessionKind,
        start: s.start,
        end: s.end,
        status: s.status as OverviewSession['status'],
        place: placeText(s, roomName),
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

/**
 * The shows by their published version, linked to their page (or the repertoire); those not yet
 * published by their draft, without a link.
 */
async function myProductions(payload: Payload, ids: number[]): Promise<OverviewProduction[]> {
  if (!ids.length) return [];
  const find = (draft: boolean) =>
    payload.find({
      collection: 'productions',
      where: { id: { in: ids }, ...(draft ? {} : { _status: { equals: 'published' } }) },
      draft,
      depth: 1,
      select: { title: true, byline: true, poster: true, slug: true, detailPage: true, order: true },
      sort: 'order',
      ...all,
    });
  const [published, drafts] = await Promise.all([find(false), find(true)]);
  const live = new Set(published.docs.map((p) => p.id));
  return [...published.docs, ...drafts.docs.filter((p) => !live.has(p.id))]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => ({
      id: p.id,
      title: p.title,
      byline: p.byline ?? undefined,
      poster: img(p.poster, 'card'),
      href: live.has(p.id) ? (p.detailPage ? `/repertoar/${p.slug}` : '/repertoar') : undefined,
    }));
}
