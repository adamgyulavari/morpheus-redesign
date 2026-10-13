/**
 * The overview's "Közelgő alkalmak": the group's sessions and the practice bookings in one shape, in
 * time order, with the date parts the list shows (Budapest time).
 */
import type { SessionKind } from '@/lib/rooms/labels';
import type { StudentOverview } from '@/lib/rooms/student';
import { addDays, clockOf, dayOf, TZ } from '@/lib/rooms/time';

export type UpcomingKind = SessionKind | 'practice';

export type UpcomingItem = {
  key: string;
  kind: UpcomingKind;
  /** The session's title, or the group / production a practice is for. */
  title: string;
  start: string;
  end: string;
  /** Room names or the external place; missing while it's still being arranged. */
  place?: string;
  /** Who booked the practice. */
  booker?: string;
  cancelled: boolean;
};

export function upcomingItems(o: StudentOverview): UpcomingItem[] {
  return [
    ...o.sessions.map(
      (s): UpcomingItem => ({
        key: `s${s.id}`,
        kind: s.kind,
        title: s.title,
        start: s.start,
        end: s.end,
        place: s.place,
        cancelled: s.status === 'cancelled',
      }),
    ),
    ...[...o.ownPractice, ...o.groupPractice].map(
      (b): UpcomingItem => ({
        key: `p${b.id}`,
        kind: 'practice',
        title: b.owner ?? b.booker,
        start: b.start,
        end: b.end,
        place: b.rooms,
        booker: b.owner ? b.booker : undefined,
        cancelled: false,
      }),
    ),
  ].sort((a, b) => a.start.localeCompare(b.start));
}

const part = (d: Date, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, ...o }).format(d);

/** Day number, month, weekday of a moment, and "Ma" / "Holnap" when it is today or tomorrow. */
export function dateParts(iso: string, now = new Date()) {
  const d = new Date(iso);
  const day = dayOf(d);
  const today = dayOf(now);
  return {
    day,
    dayNumber: part(d, { day: 'numeric' }).replace('.', ''),
    month: part(d, { month: 'short' }),
    weekday: part(d, { weekday: 'long' }),
    /** H, K, Sze, Cs, P, Szo, V */
    weekdayShort: part(d, { weekday: 'short' }),
    relative: day === today ? 'Ma' : day === addDays(today, 1) ? 'Holnap' : undefined,
  };
}

export const timeRange = (i: UpcomingItem) => `${clockOf(new Date(i.start))}–${clockOf(new Date(i.end))}`;

/** Items grouped by Budapest day, in order. */
export function byDay(items: UpcomingItem[]) {
  const days: { day: string; items: UpcomingItem[] }[] = [];
  for (const i of items) {
    const day = dayOf(new Date(i.start));
    const last = days.at(-1);
    if (last?.day === day) last.items.push(i);
    else days.push({ day, items: [i] });
  }
  return days;
}
