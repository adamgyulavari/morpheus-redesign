/**
 * How a Facebook event becomes a performance date: its production (the longest production title
 * found in the event's name), its venue (by name), the label (the words below), the Budapest date
 * and time. Pure, for the sync and its tests.
 */
import { clockOf, dayOf } from '@/lib/rooms/time';

/** Comparable text: lower case, no accents, no punctuation, single spaces. */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** The production whose title appears in the event's name (the longest one, if several). */
export function matchProduction<T extends { title: string }>(eventName: string, productions: T[]): T | undefined {
  const name = ` ${normalize(eventName)} `;
  return productions
    .filter((p) => normalize(p.title) && name.includes(` ${normalize(p.title)} `))
    .sort((a, b) => normalize(b.title).length - normalize(a.title).length)[0];
}

/** The venue named by the event's place ("ÚJ CÍMÜNK: 1027 Budapest, …" or a shorter name). */
export function matchVenue<T extends { name: string }>(place: string | undefined, venues: T[]): T | undefined {
  if (!place) return undefined;
  const p = normalize(place.replace(/^\s*új címünk\s*:/i, ''));
  if (!p) return undefined;
  return venues.find((v) => {
    const n = normalize(v.name);
    return n === p || n.startsWith(p) || p.startsWith(n) || p.includes(n);
  });
}

/** The words of an event's name that become the date's label on the site (others don't). */
const LABELS = ['Nyilvános főpróba', 'Bemutató'];
export const labelOf = (eventName: string) => {
  const name = ` ${normalize(eventName)} `;
  return LABELS.filter((l) => name.includes(` ${normalize(l)} `)).join(', ') || undefined;
};

/** "2026-10-28T19:00:00+0100" → { date: "2026-10-28", time: "19:00" } in Budapest. */
export function localStart(startTime: string) {
  const d = new Date(startTime.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return { date: dayOf(d), time: clockOf(d) };
}
