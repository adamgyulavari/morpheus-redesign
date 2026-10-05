/**
 * The data layer. This is the ONLY module that reads `content/`; pages and components call these
 * async functions and never import JSON themselves.
 *
 * Today everything comes from static JSON bundled at build time. To move to a CMS (Payload, Sanity…),
 * re-implement the functions below against its API and keep the signatures and return types:
 * nothing outside this file has to change. They are already async for that reason.
 *
 * Caching: the page routes export `revalidate = 86400`, so Next.js re-renders them at most once a
 * day (ISR) and anything dated before "today" drops off without a redeploy. With a CMS,
 * on-demand revalidation from its publish webhook (`revalidatePath`) can be added on top.
 */
import 'server-only';

import contactPeopleJson from '@/content/contact-people.json';
import coursesJson from '@/content/courses.json';
import ctaBandsJson from '@/content/cta-bands.json';
import instructorsJson from '@/content/instructors.json';
import openWorkshopSessionsJson from '@/content/open-workshop-sessions.json';
import legalPageJson from '@/content/pages/adatkezelesi-tajekoztato.json';
import bioPageJson from '@/content/pages/bio.json';
import teamBuildingPageJson from '@/content/pages/csapatepito.json';
import homePageJson from '@/content/pages/home.json';
import contactPageJson from '@/content/pages/kapcsolat.json';
import coursesPageJson from '@/content/pages/kepzesek.json';
import beginnerCoursePageJson from '@/content/pages/kezdo-kurzus.json';
import upcomingShowsPageJson from '@/content/pages/kozelgo-eloadasok.json';
import openSessionsPageJson from '@/content/pages/nyitott-alkalmak.json';
import instructorsPageJson from '@/content/pages/oktatok.json';
import repertoirePageJson from '@/content/pages/repertoar.json';
import aboutPageJson from '@/content/pages/rolunk.json';
import advancedCoursePageJson from '@/content/pages/szakmai-kurzus.json';
import productionsJson from '@/content/productions.json';
import reviewsJson from '@/content/reviews.json';
import showsJson from '@/content/shows.json';
import siteSettingsJson from '@/content/site-settings.json';
import teamBuildingProgrammesJson from '@/content/team-building-programmes.json';
import uiJson from '@/content/ui.json';
import venuesJson from '@/content/venues.json';
import workshopsJson from '@/content/workshops.json';

import { todayInBudapest } from './dates';
import type {
  ContactPerson,
  Course,
  Instructor,
  CtaBand,
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
  Venue,
  Workshop,
} from './types';

// JSON imports are typed structurally by TypeScript (e.g. `group: string`), so each collection is
// asserted to its content type once, here. A CMS client would return typed documents instead.
const productions = productionsJson as Production[];
const shows = showsJson as Show[];
const venues = venuesJson as Venue[];
const reviews = reviewsJson as Review[];
const instructors = instructorsJson as Instructor[];
const courses = coursesJson as Course[];
const openWorkshopSessions = openWorkshopSessionsJson as OpenWorkshopSession[];
const teamBuildingProgrammes = teamBuildingProgrammesJson as TeamBuildingProgramme[];
const contactPeople = contactPeopleJson as ContactPerson[];
const workshops = workshopsJson as Workshop[];
const siteSettings = siteSettingsJson as SiteSettings;

const ctaBands = ctaBandsJson as CtaBand[];
const ui = uiJson as UiStrings;

// The Pages collection: each page is a route + a list of typed blocks.
const pages = [
  homePageJson,
  aboutPageJson,
  coursesPageJson,
  beginnerCoursePageJson,
  advancedCoursePageJson,
  openSessionsPageJson,
  repertoirePageJson,
  upcomingShowsPageJson,
  teamBuildingPageJson,
  contactPageJson,
  instructorsPageJson,
  legalPageJson,
  bioPageJson,
] as Page[];

function byId<T extends { id: string }>(items: T[], id: string, kind: string): T {
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown ${kind} "${id}"`);
  return item;
}

const byDateTime = (a: { date: string; time?: string; startTime?: string }, b: typeof a) =>
  `${a.date} ${a.time ?? a.startTime ?? ''}`.localeCompare(`${b.date} ${b.time ?? b.startTime ?? ''}`);

// ── Site & pages ────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings;
}

/** Component text (labels, empty states, aria labels) — one editable dictionary. */
export async function getUi(): Promise<UiStrings> {
  return ui;
}

export async function getPages(): Promise<Page[]> {
  return pages;
}

/** The page at a route ("/", "/rolunk"), or undefined. */
export async function getPage(path: string): Promise<Page | undefined> {
  return pages.find((p) => p.path === path);
}

export async function getCtaBand(id: string): Promise<CtaBand> {
  return byId(ctaBands, id, 'CTA band');
}

// ── Productions & shows ─────────────────────────────────────────────────────

export async function getProductions(group?: ProductionGroup): Promise<Production[]> {
  return group ? productions.filter((p) => p.group === group) : productions;
}

/** A production by slug, or undefined. */
export async function getProduction(slug: string): Promise<Production | undefined> {
  return productions.find((p) => p.slug === slug);
}

/** Productions that have their own page (statically generated under /repertoar/[slug]/). */
export async function getProductionsWithDetailPage(): Promise<Production[]> {
  return productions.filter((p) => p.detailPage);
}

/** Upcoming shows of one production, soonest first. */
export async function getShowsForProduction(productionId: string): Promise<ShowWithRelations[]> {
  return (await getUpcomingShows()).filter((s) => s.productionId === productionId);
}

/** Shows from today on (Budapest time), soonest first, joined with their production and venue. */
export async function getUpcomingShows(limit?: number): Promise<ShowWithRelations[]> {
  const today = todayInBudapest();
  const upcoming = shows
    .filter((s) => s.date >= today)
    .sort(byDateTime)
    .map((s) => ({ ...s, production: byId(productions, s.productionId, 'production'), venue: byId(venues, s.venueId, 'venue') }));
  return limit === undefined ? upcoming : upcoming.slice(0, limit);
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

export async function getReviews(): Promise<Review[]> {
  return reviews;
}

export async function getInstructors(): Promise<Instructor[]> {
  return [...instructors].sort((a, b) => a.order - b.order);
}

export async function getContactPeople(): Promise<ContactPerson[]> {
  return contactPeople;
}

export async function getContactPerson(id: string): Promise<ContactPerson> {
  return byId(contactPeople, id, 'contact person');
}

// ── Courses & events ────────────────────────────────────────────────────────

/** A course with its start dates filtered to today onward (Budapest time), soonest first. */
export async function getCourse(id: string): Promise<Course> {
  const course = byId(courses, id, 'course');
  const today = todayInBudapest();
  return { ...course, starts: course.starts.filter((s) => s.date >= today).sort(byDateTime) };
}

export async function getCourses(): Promise<Course[]> {
  return Promise.all(courses.map((c) => getCourse(c.id)));
}

/** Upcoming open-workshop sessions (today onward), soonest first. */
export async function getOpenWorkshopSessions(limit?: number): Promise<OpenWorkshopSession[]> {
  const today = todayInBudapest();
  const upcoming = openWorkshopSessions.filter((s) => s.date >= today).sort(byDateTime);
  return limit === undefined ? upcoming : upcoming.slice(0, limit);
}

/** Workshops and camps that haven't ended yet (Budapest time), soonest first. */
export async function getUpcomingWorkshops(): Promise<Workshop[]> {
  const today = todayInBudapest();
  return workshops.filter((w) => w.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Workshops and camps that have ended, most recent first. */
export async function getPastWorkshops(limit?: number): Promise<Workshop[]> {
  const today = todayInBudapest();
  const past = workshops.filter((w) => w.endDate < today).sort((a, b) => b.startDate.localeCompare(a.startDate));
  return limit === undefined ? past : past.slice(0, limit);
}

/**
 * A legal document stored as Markdown in content/legal/<slug>.md (copied verbatim from the old site).
 * Read from disk at build time — this module only ever runs on the server.
 */
export async function getLegalPage(slug: string): Promise<{ markdown: string }> {
  const { readFile } = await import('node:fs/promises');
  const path = await import('node:path');
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid legal page "${slug}"`);
  return { markdown: await readFile(path.join(process.cwd(), 'content', 'legal', `${slug}.md`), 'utf-8') };
}

export async function getTeamBuildingProgrammes(): Promise<TeamBuildingProgramme[]> {
  return teamBuildingProgrammes;
}
