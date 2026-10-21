/**
 * The data layer: the only module that reads content. Pages and components call these async
 * functions; the content comes from Payload CMS (Postgres) through its Local API, and
 * lib/cms-map.ts converts the documents to the types in lib/types.ts.
 *
 * - Visitors see published documents only (access control is applied, `overrideAccess: false`).
 *   In draft mode (an editor's preview / live preview) the latest drafts are shown instead.
 * - Dated items (shows, course starts, sessions, workshops) are filtered against today in
 *   Budapest. The pages are cached (ISR) and re-rendered when an editor saves (payload/revalidate.ts)
 *   and every hour by the `revalidateDates` job, so past items drop off without an edit.
 * - Nothing here runs at build time: the routes have no build-time data fetching.
 */
import 'server-only';

import config from '@payload-config';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { draftMode } from 'next/headers';
import { getPayload, type Payload } from 'payload';
import { cache } from 'react';
import { uiTexts } from '@/payload/ui-texts';
import type * as P from '@/payload-types';
import type { CourseGroup } from '@/payload-types';
import { courseSignupState, showState } from './applications/rules';
import { courseFacts, SIGNUP_ON, takenBy, upcomingWorkshops } from './applications/server';
import { bookedHere, seatsTaken, showFacts, ticketPrice } from './applications/shows';

import * as map from './cms-map';
import { todayInBudapest } from './dates';
import { billingSettings } from './payments/settings';
import type {
  ContactPerson,
  Course,
  CtaBand,
  Instructor,
  OpenWorkshopSession,
  Page,
  Production,
  ProductionGroup,
  Review,
  Show,
  ShowWithRelations,
  SiteSettings,
  TeamBuildingProgramme,
  UiStrings,
  Workshop,
} from './types';

const payload = () => getPayload({ config });

/** Draft mode is on while an editor previews; outside a request (e.g. scripts) it is off. */
const isDraft = cache(async (): Promise<boolean> => {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
});

/** Options for collections with drafts: published only for visitors, latest draft in preview. */
async function drafts() {
  return (await isDraft()) ? { draft: true, overrideAccess: true } : { draft: false, overrideAccess: false };
}

/**
 * Stored days are timestamps around noon (Budapest), so "on or after today" is "after today's
 * midnight UTC" — no time zone arithmetic needed.
 */
const fromToday = (): string => `${todayInBudapest()}T00:00:00.000Z`;

const all = { limit: 0, pagination: false } as const;
const numId = (id: string) => (/^\d+$/.test(id) ? Number(id) : id);

// ── Site & pages ────────────────────────────────────────────────────────────

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  return map.siteSettings(await (await payload()).findGlobal({ slug: 'siteSettings', depth: 0 }));
});

/** Component text (labels, empty states, aria labels) — the UI texts of a language. */
export const getUi = cache(async (lang?: string): Promise<UiStrings> => uiTexts(await payload(), lang));

const PAGE_POPULATE = { pages: { path: true, title: true } } as const;

export async function getPages(): Promise<Page[]> {
  const { docs } = await (await payload()).find({
    collection: 'pages',
    depth: 2,
    populate: PAGE_POPULATE,
    ...all,
    ...(await drafts()),
  });
  return docs.map(map.page);
}

/** The page at a route ("/", "/rolunk"), or undefined. */
export const getPage = cache(async (path: string): Promise<Page | undefined> => {
  const { docs } = await (await payload()).find({
    collection: 'pages',
    where: { path: { equals: path } },
    depth: 2,
    populate: PAGE_POPULATE,
    limit: 1,
    ...(await drafts()),
  });
  return docs[0] && map.page(docs[0]);
});

export const getCtaBand = cache(async (id: string): Promise<CtaBand> => {
  return map.ctaBand(await (await payload()).findByID({ collection: 'ctaBands', id: numId(id), depth: 0 }));
});

// ── Productions & shows ─────────────────────────────────────────────────────

const findProductions = cache(async (): Promise<Production[]> => {
  const { docs } = await (await payload()).find({
    collection: 'productions',
    sort: 'order',
    depth: 1,
    ...all,
    ...(await drafts()),
  });
  return docs.map(map.production);
});

export async function getProductions(group?: ProductionGroup): Promise<Production[]> {
  const productions = await findProductions();
  return group ? productions.filter((p) => p.group === group) : productions;
}

/** A production by slug, or undefined. */
export async function getProduction(slug: string): Promise<Production | undefined> {
  return (await findProductions()).find((p) => p.slug === slug);
}

/** Productions that have their own page under /repertoar/[slug]/. */
export async function getProductionsWithDetailPage(): Promise<Production[]> {
  return (await findProductions()).filter((p) => p.detailPage);
}

/** Upcoming shows of one production, soonest first. */
export async function getShowsForProduction(productionId: string): Promise<ShowWithRelations[]> {
  return (await getUpcomingShows()).filter((s) => s.productionId === productionId);
}

/** The site's own booking of the shows booked here: the seats left, open / full / closed. */
async function bookingsOf(p: Payload, docs: P.Show[]): Promise<Map<number, NonNullable<Show['booking']>>> {
  const here = docs.filter((d) => bookedHere(d) && d.code);
  if (!here.length) return new Map();
  const [taken, { showDefaults }] = await Promise.all([
    seatsTaken(
      p,
      here.map((d) => d.id),
    ),
    billingSettings(p),
  ]);
  const now = new Date();
  return new Map(
    here.map((d) => {
      const state = showState(showFacts(d, taken.get(d.id) ?? 0), now);
      return [
        d.id,
        {
          code: d.code as string,
          price: ticketPrice(d),
          state: state.state,
          left: state.state === 'open' ? state.left : 0,
          maxPerBooking: showDefaults.maxPerBooking,
        },
      ];
    }),
  );
}

const findUpcomingShows = cache(async (): Promise<ShowWithRelations[]> => {
  const p = await payload();
  const [{ docs }, productions] = await Promise.all([
    p.find({
      collection: 'shows',
      where: { and: [{ date: { greater_than_equal: fromToday() } }, { hidden: { not_equals: true } }] },
      sort: ['date', 'time'],
      depth: 1,
      ...all,
    }),
    findProductions(),
  ]);
  // Only shows of published productions (or, in preview, of any).
  const byId = new Map(productions.map((x) => [x.id, x]));
  const ids = new Set<string>();
  const booking = await bookingsOf(p, docs);
  return docs.flatMap((doc) => {
    const show = { ...map.show(doc), booking: booking.get(doc.id) };
    const production = byId.get(show.productionId);
    const venue = typeof doc.venue === 'object' ? map.venue(doc.venue) : undefined;
    if (!production || !venue) return [];
    // readable, stable id — it is the anchor in links like /kozelgo-eloadasok#eloadas-az-ordog-2026-10-28
    let id = `${production.slug}-${show.date}`;
    if (ids.has(id)) id += `-${show.time.replace(':', '')}`;
    ids.add(id);
    return [{ ...show, id, production, venue }];
  });
});

/** Shows from today on (Budapest time), soonest first, joined with their production and venue. */
export async function getUpcomingShows(limit?: number): Promise<ShowWithRelations[]> {
  const upcoming = await findUpcomingShows();
  return limit === undefined ? upcoming : upcoming.slice(0, limit);
}

/** The next shows of different productions, soonest first (the rotating "Következő előadás" cards). */
export async function getFeaturedShows(count = 5): Promise<ShowWithRelations[]> {
  return [...(await getNextShowByProduction()).values()].slice(0, count);
}

/** The next show of each production that has one, keyed by production id. */
export async function getNextShowByProduction(): Promise<Map<string, ShowWithRelations>> {
  const next = new Map<string, ShowWithRelations>();
  for (const show of await getUpcomingShows()) {
    if (!next.has(show.productionId)) next.set(show.productionId, show);
  }
  return next;
}

// ── People ──────────────────────────────────────────────────────────────────

export const getReviews = cache(async (): Promise<Review[]> => {
  const { docs } = await (await payload()).find({ collection: 'reviews', sort: 'order', depth: 1, ...all });
  return docs.map(map.review);
});

export const getInstructors = cache(async (): Promise<Instructor[]> => {
  const { docs } = await (await payload()).find({ collection: 'instructors', sort: 'order', depth: 1, ...all });
  return docs.map(map.instructor);
});

export const getContactPeople = cache(async (): Promise<ContactPerson[]> => {
  const { docs } = await (await payload()).find({ collection: 'contactPeople', sort: 'order', depth: 1, ...all });
  return docs.map(map.contactPerson);
});

export async function getContactPerson(id: string): Promise<ContactPerson> {
  const person = (await getContactPeople()).find((c) => c.id === id);
  if (!person) throw new Error(`Unknown contact person "${id}"`);
  return person;
}

// ── Courses & events ────────────────────────────────────────────────────────

/**
 * Courses with their starts: the course groups linked to them that take sign-ups on the site and
 * haven't started, soonest first, with the live sign-up state. Groups aren't public in the API;
 * only these fields are read here (and the places count).
 */
const findCourses = cache(async (): Promise<Course[]> => {
  const p = await payload();
  const [{ docs: courses }, { docs: groups }] = await Promise.all([
    p.find({ collection: 'courses', depth: 0, ...all }),
    p.find({
      collection: 'courseGroups',
      where: { and: [SIGNUP_ON, { startDate: { greater_than_equal: fromToday() } }] },
      depth: 0,
      sort: 'startDate',
      select: {
        title: true,
        code: true,
        type: true,
        course: true,
        startDate: true,
        defaultSchedule: true,
        signup: true,
      },
      overrideAccess: true,
      ...all,
    }),
  ]);
  const taken = await takenBy(
    p,
    'course_group_id',
    groups.map((g) => g.id),
  );
  const now = new Date();
  const [online, { course }] = await Promise.all([billingSettings(p).then((b) => b.online), getUi()]);
  const starts = groups.map((g) => ({
    courseId: g.course == null ? null : String(typeof g.course === 'object' ? g.course.id : g.course),
    start: map.courseStart(
      g as CourseGroup,
      courseSignupState(courseFacts(g as CourseGroup, taken.get(g.id)?.taken ?? 0), now),
      online,
      course.priceFrom,
    ),
  }));
  return courses.map((c) =>
    map.course(
      c,
      starts.filter((s) => s.courseId === String(c.id)).map((s) => s.start),
    ),
  );
});

/** A course with its upcoming groups open for sign-up. */
export async function getCourse(id: string): Promise<Course> {
  const course = (await findCourses()).find((c) => c.id === id);
  if (!course) throw new Error(`Unknown course "${id}"`);
  return course;
}

export async function getCourses(): Promise<Course[]> {
  return findCourses();
}

/** Upcoming Nyitott Műhely dates (live `workshop` sessions, not cancelled), soonest first. */
export async function getOpenWorkshopSessions(limit?: number): Promise<OpenWorkshopSession[]> {
  return (await upcomingWorkshops(await payload(), new Date(), limit ?? 20)).map(map.openWorkshopSession);
}

const findWorkshops = cache(async (): Promise<Workshop[]> => {
  const { docs } = await (await payload()).find({ collection: 'workshops', sort: 'startDate', depth: 1, ...all });
  return docs.map(map.workshop);
});

/** Workshops and camps that haven't ended yet (Budapest time), soonest first. */
export async function getUpcomingWorkshops(): Promise<Workshop[]> {
  const today = todayInBudapest();
  return (await findWorkshops()).filter((w) => w.endDate >= today);
}

/** Workshops and camps that have ended, most recent first. */
export async function getPastWorkshops(limit?: number): Promise<Workshop[]> {
  const today = todayInBudapest();
  const past = (await findWorkshops()).filter((w) => w.endDate < today).reverse();
  return limit === undefined ? past : past.slice(0, limit);
}

/** A legal document (rich text) by slug. */
export async function getLegalPage(
  slug: string,
): Promise<{ title: string; effectiveDate?: string; content: SerializedEditorState }> {
  const { docs } = await (await payload()).find({
    collection: 'legalPages',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    ...(await drafts()),
  });
  const doc = docs[0];
  if (!doc) throw new Error(`Unknown legal page "${slug}"`);
  return {
    title: doc.title,
    effectiveDate: doc.effectiveDate ? map.day(doc.effectiveDate) : undefined,
    content: doc.body as SerializedEditorState,
  };
}

export const getTeamBuildingProgrammes = cache(async (): Promise<TeamBuildingProgramme[]> => {
  const { docs } = await (await payload()).find({
    collection: 'teamBuildingProgrammes',
    sort: 'order',
    depth: 0,
    ...all,
  });
  return docs.map(map.teamBuildingProgramme);
});

// ── Redirects ───────────────────────────────────────────────────────────────

/**
 * Where an old address (e.g. the previous site's /rolunk-2/) should go, or undefined. Looked up only
 * for paths that have no page. The trailing slash doesn't matter.
 */
export async function getRedirect(path: string): Promise<{ href: string; permanent: boolean } | undefined> {
  const bare = path.replace(/\/+$/, '') || '/';
  const { docs } = await (await payload()).find({
    collection: 'redirects',
    where: { from: { in: [bare, `${bare}/`] } },
    depth: 1,
    populate: { pages: { path: true }, productions: { slug: true } },
    limit: 1,
  });
  const r = docs[0];
  if (!r) return undefined;
  const target = r.to?.type === 'reference' ? r.to.reference : undefined;
  const ref = target && typeof target.value === 'object' ? target.value : undefined;
  const href =
    r.to?.type === 'custom'
      ? r.to.url
      : target?.relationTo === 'productions'
        ? ref && 'slug' in ref && ref.slug && `/repertoar/${ref.slug}`
        : ref && 'path' in ref && ref.path;
  return href ? { href, permanent: r.type !== '302' } : undefined;
}

/** Whether workshop sign-ups go through the online checkout ("Fizetési beállítások"). */
export const getOnlinePayments = cache(async () => (await billingSettings(await payload())).online);
