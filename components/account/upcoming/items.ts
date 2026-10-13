/**
 * The overview's "Közelgő alkalmak": the group's sessions, the practice bookings and the person's
 * Nyitott Műhely dates in one shape, in time order, with the date parts the list shows (Budapest time).
 */

import type { MyApplications } from '@/lib/applications/overview';
import { dayOfMonth, monthShort, todayInBudapest, weekday } from '@/lib/dates';
import type { SessionKind } from '@/lib/rooms/labels';
import type { StudentOverview } from '@/lib/rooms/student';
import { addDays, clockOf, dayOf } from '@/lib/rooms/time';

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
  /** The person's own Nyitott Műhely sign-up: what they may do with it. */
  application?: { id: number; canCancel: boolean; canMove: boolean; moveTargets: { id: number; label: string }[] };
};

export function upcomingItems(o: StudentOverview, mine: MyApplications): UpcomingItem[] {
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
    ...mine.workshops.map(
      (w): UpcomingItem => ({
        key: `w${w.applicationId}`,
        kind: 'workshop',
        title: w.title,
        start: w.start,
        end: w.end,
        place: w.place,
        cancelled: w.cancelled,
        application: { id: w.applicationId, canCancel: w.canCancel, canMove: w.canMove, moveTargets: mine.moveTargets },
      }),
    ),
  ].sort((a, b) => a.start.localeCompare(b.start));
}

/** Day number, month, weekday of a moment, and "Ma" / "Holnap" when it is today or tomorrow. */
export function dateParts(iso: string) {
  const day = dayOf(new Date(iso));
  const today = todayInBudapest();
  return {
    dayNumber: dayOfMonth(day),
    month: monthShort(day),
    weekday: weekday(day),
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
