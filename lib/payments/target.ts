/**
 * What a paid sign-up is for — a workshop date, a kezdő group, or a course without a group: its
 * e-mail details, whether one may sign up for it now, and its checkout.
 */
import type { Payload, Where } from 'payload';

import type { TargetInfo } from '@/lib/applications/notify';
import {
  canApplyWithoutGroup,
  canBookShow,
  canSignUpCourse,
  canSignUpWorkshop,
  type RuleResult,
} from '@/lib/applications/rules';
import { courseFacts, courseInfo, NOBODY, takenBy, workshopFacts, workshopInfo } from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { seatsTaken, showFacts, showInfo } from '@/lib/applications/shows';
import { relId } from '@/payload/rel';
import type { Application, Course, CourseGroup } from '@/payload-types';

import { checkoutPath, courseCheckoutPath, showCheckoutPath } from './links';
import { billingSettings } from './settings';

export type Target = {
  info: TargetInfo;
  /** May one sign up (again) now? */
  verdict: RuleResult;
  /** The checkout for it ("Újra jelentkezem"). */
  againPath: string;
};

/** The workshop date by its public code (the checkout's link). */
export async function sessionByCode(payload: Payload, code: string) {
  if (!code || code.length > 32) return null;
  const { docs } = await payload.find({
    collection: 'sessions',
    where: { and: [{ code: { equals: code } }, { kind: { equals: 'workshop' } }] },
    depth: 0,
    limit: 1,
  });
  return docs[0] ?? null;
}

/** A course group by its public code. */
export async function groupByCode(payload: Payload, code: string) {
  if (!code || code.length > 32) return null;
  const { docs } = await payload.find({
    collection: 'courseGroups',
    where: { code: { equals: code } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return docs[0] ?? null;
}

/** Applications for the same thing (one person can't hold it twice). */
export const sameTarget = (a: Pick<Application, 'kind' | 'session' | 'courseGroup' | 'course' | 'show'>): Where =>
  a.kind === 'show'
    ? { show: { equals: relId(a.show) } }
    : a.kind === 'workshop'
      ? { session: { equals: relId(a.session) } }
      : relId(a.courseGroup)
        ? { courseGroup: { equals: relId(a.courseGroup) } }
        : { and: [{ course: { equals: relId(a.course) } }, { courseGroup: { exists: false } }] };

export async function courseTarget(
  payload: Payload,
  course: Course,
  group: CourseGroup | null,
  now: Date,
): Promise<Target> {
  if (!group)
    return {
      info: { title: course.title, withoutGroup: true },
      verdict: canApplyWithoutGroup(course, 'beginner')
        ? { ok: true }
        : { ok: false, reason: 'Erre a kurzusra most nem lehet jelentkezni.' },
      againPath: courseCheckoutPath(course.slug),
    };
  const taken = (await takenBy(payload, 'course_group_id', [group.id])).get(group.id)?.taken ?? 0;
  return {
    info: courseInfo(group),
    verdict: canSignUpCourse(courseFacts(group, taken), now),
    againPath: courseCheckoutPath(course.slug, group.code ?? undefined),
  };
}

/** The target of an existing application. */
export async function targetOf(payload: Payload, a: Application, now: Date): Promise<Target> {
  if (a.kind === 'show') {
    const s = await payload.findByID({ collection: 'shows', id: relId(a.show) ?? 0, depth: 1 });
    const taken = (await seatsTaken(payload, [s.id])).get(s.id) ?? 0;
    const { maxPerBooking } = (await billingSettings(payload)).showDefaults;
    const production = typeof s.production === 'object' ? s.production : null;
    return {
      info: showInfo(s, a.seats ?? 1),
      verdict: canBookShow(showFacts(s, taken), a.seats ?? 1, maxPerBooking, now),
      againPath: s.code ? showCheckoutPath(s.code) : `/repertoar/${production?.slug ?? ''}`,
    };
  }
  if (a.kind === 'workshop') {
    const settings = await applicationSettings(payload);
    const s = await payload.findByID({ collection: 'sessions', id: relId(a.session) ?? 0, depth: 0 });
    const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
    return {
      info: await workshopInfo(payload, s, settings),
      verdict: canSignUpWorkshop(workshopFacts(s, taken), now, settings),
      againPath: s.code ? checkoutPath(s.code) : '/nyitott-alkalmak/',
    };
  }
  const group = relId(a.courseGroup)
    ? await payload.findByID({ collection: 'courseGroups', id: relId(a.courseGroup) ?? 0, depth: 0 })
    : null;
  const course = await payload.findByID({
    collection: 'courses',
    id: relId(a.course) ?? relId(group?.course) ?? 0,
    depth: 0,
  });
  return courseTarget(payload, course, group, now);
}
