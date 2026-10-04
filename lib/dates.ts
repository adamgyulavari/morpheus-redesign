/**
 * Date helpers. All content dates are Budapest calendar dates; these work the same on a server
 * running in UTC and in a visitor's browser, so "today" and deadlines don't shift by time zone.
 */
const TZ = 'Europe/Budapest';

/** Today's date in Budapest as "YYYY-MM-DD". */
export function todayInBudapest(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** True while it is still `isoDate` (or earlier) in Budapest — i.e. "until the end of that day". */
export function isOnOrBeforeInBudapest(isoDate: string, now: Date = new Date()): boolean {
  return todayInBudapest(now) <= isoDate;
}

/** A calendar date as a Date at noon UTC, safe for formatting the day/month/weekday in any zone. */
function asDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

const fmt = (isoDate: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('hu-HU', { timeZone: 'UTC', ...options }).format(asDate(isoDate));

/** "3" */
export const dayOfMonth = (isoDate: string) => String(asDate(isoDate).getUTCDate());
/** "okt." */
export const monthShort = (isoDate: string) => fmt(isoDate, { month: 'short' });
/** "szeptember" */
export const monthLong = (isoDate: string) => fmt(isoDate, { month: 'long' });
/** "szombat" */
export const weekday = (isoDate: string) => fmt(isoDate, { weekday: 'long' });
/** "2026" */
export const year = (isoDate: string) => fmt(isoDate, { year: 'numeric' }).replace(/\.$/, '');
/** "okt. 8." */
export const monthDayShort = (isoDate: string) => `${monthShort(isoDate)} ${dayOfMonth(isoDate)}.`;

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Okt. 3., szombat · 18:00" */
export function showDateLine(isoDate: string, time: string): string {
  return `${capitalise(monthDayShort(isoDate))}, ${weekday(isoDate)} · ${time}`;
}

/** "2026. október 22–25." / "2026. október 30. – november 2." / across years: full dates on both sides. */
export function dateRange(start: string, end: string): string {
  if (start === end) return `${year(start)}. ${monthLong(start)} ${dayOfMonth(start)}.`;
  if (year(start) !== year(end)) return `${year(start)}. ${monthLong(start)} ${dayOfMonth(start)}. – ${year(end)}. ${monthLong(end)} ${dayOfMonth(end)}.`;
  if (monthLong(start) !== monthLong(end))
    return `${year(start)}. ${monthLong(start)} ${dayOfMonth(start)}. – ${monthLong(end)} ${dayOfMonth(end)}.`;
  return `${year(start)}. ${monthLong(start)} ${dayOfMonth(start)}–${dayOfMonth(end)}.`;
}

/** "csütörtök–vasárnap" */
export const weekdayRange = (start: string, end: string) => (start === end ? weekday(start) : `${weekday(start)}–${weekday(end)}`);
