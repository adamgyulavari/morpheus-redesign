/**
 * The admin sidebar in one place: which group each collection and global is in, and the groups'
 * order. Above them (beforeNavLinks): Irányítópult, Jelentkezések, Teremnaptár (payload/components/NavTop).
 */
import type { CollectionConfig, GlobalConfig } from 'payload';

export const NAV_GROUPS = ['Napi munka', 'Weboldal', 'Emberek', 'Beállítások'] as const;
type NavGroup = (typeof NAV_GROUPS)[number];

const GROUP_OF: Record<string, NavGroup> = {
  // weekly work
  courseGroups: 'Napi munka',
  shows: 'Napi munka',
  // what the website shows
  pages: 'Weboldal',
  productions: 'Weboldal',
  courses: 'Weboldal',
  workshops: 'Weboldal',
  teamBuildingProgrammes: 'Weboldal',
  instructors: 'Weboldal',
  reviews: 'Weboldal',
  media: 'Weboldal',
  // accounts and contacts
  users: 'Emberek',
  contactPeople: 'Emberek',
  // set up once, or the raw lists behind the dashboard and the room calendar
  ctaBands: 'Beállítások',
  legalPages: 'Beállítások',
  redirects: 'Beállítások',
  venues: 'Beállítások',
  rooms: 'Beállítások',
  studentLinks: 'Beállítások',
  sessions: 'Beállítások',
  roomBookings: 'Beállítások',
  applications: 'Beállítások',
  siteSettings: 'Beállítások',
  ui: 'Beállítások',
  roomBookingSettings: 'Beállítások',
  applicationSettings: 'Beállítások',
};

/** The group of a slug (for the redirects plugin's overrides). */
export const navGroup = (slug: string): NavGroup => GROUP_OF[slug] ?? 'Beállítások';

const ORDER = Object.keys(GROUP_OF);

/**
 * Sets each one's sidebar group, in the order above: by group, then as listed (the sidebar shows
 * groups and items in the order they come).
 */
export function arrangeNav<T extends CollectionConfig | GlobalConfig>(items: T[]): T[] {
  const rank = (t: T) => NAV_GROUPS.indexOf(navGroup(t.slug)) * 1000 + (ORDER.indexOf(t.slug) + 1 || 999);
  return items
    .map((t) => (t.admin?.hidden ? t : { ...t, admin: { ...t.admin, group: navGroup(t.slug) } }))
    .sort((a, b) => rank(a) - rank(b));
}
