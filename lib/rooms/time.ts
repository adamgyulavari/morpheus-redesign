/**
 * Room-calendar time helpers. Moments are stored in UTC; days, weekdays and clock times are
 * Budapest's, DST-safe (a "Tuesday 18:00" is 18:00 in Budapest in both summer and winter time).
 */
import { TZDate } from '@date-fns/tz';

import { TZ } from '@/lib/dates';

export { TZ };

/** "YYYY-MM-DD" in Budapest. */
export function dayOf(moment: Date): string {
  const d = new TZDate(moment, TZ);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Minutes since midnight in Budapest (0–1439). */
export function minutesOf(moment: Date): number {
  const d = new TZDate(moment, TZ);
  return d.getHours() * 60 + d.getMinutes();
}

/** "HH:mm" in Budapest. */
export const clockOf = (moment: Date): string => {
  const m = minutesOf(moment);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

/** The moment of a Budapest day ("YYYY-MM-DD") and clock time ("HH:mm"). */
export function at(day: string, clock: string): Date {
  const [y, mo, d] = day.split('-').map(Number) as [number, number, number];
  const [h, mi] = clock.split(':').map(Number) as [number, number];
  return new Date(new TZDate(y, mo - 1, d, h, mi, 0, TZ).getTime());
}

/** ISO weekday of a Budapest day: 1 = Monday … 7 = Sunday. */
export function weekdayOf(day: string): number {
  const [y, mo, d] = day.split('-').map(Number) as [number, number, number];
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** All days of a month: daysOfMonth(2026, 11) → ["2026-11-01", …, "2026-11-30"]. */
export function daysOfMonth(year: number, month: number): string[] {
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`);
}

/** The day `n` days after a Budapest day. */
export function addDays(day: string, n: number): string {
  const [y, mo, d] = day.split('-').map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, mo - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Monday of the (Budapest) week a day is in. */
export const mondayOf = (day: string): string => addDays(day, 1 - weekdayOf(day));

/** "HH:mm" → minutes since midnight. */
export function clockMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

const pad = (n: number) => String(n).padStart(2, '0');
