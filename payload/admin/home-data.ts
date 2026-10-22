/**
 * The admin home ("Irányítópult"): what needs doing, the coming week, and whether next month is
 * filled. Read on the server for staff.
 */
import type { Payload } from 'payload';

import { countWaiting, dashboard } from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { monthLong, todayInBudapest, weekday } from '@/lib/dates';
import { placeText } from '@/lib/rooms/format';
import { SESSION_KINDS, type SessionKind } from '@/lib/rooms/labels';
import { roomNameMap } from '@/lib/rooms/occupancy';
import { countUnplaced, planFill } from '@/lib/rooms/server';
import { addDays, at, clockOf, dayOf, daysOfMonth } from '@/lib/rooms/time';

export type Todo = { text: string; href: string; tone: 'warn' | 'info' };

export type WeekItem = { time: string; title: string; kind: SessionKind; place: string; cancelled: boolean };

/** Upcoming sessions without a place, as a filtered list of the sessions collection. */
export const unplacedListHref = (now = new Date()) =>
  `/admin/collections/sessions?where[and][0][locationType][equals]=unplaced&where[and][1][status][equals]=scheduled&where[and][2][start][greater_than]=${encodeURIComponent(now.toISOString())}&sort=start`;

export async function homeData(payload: Payload, now = new Date()) {
  const [apps, waiting, unplaced, settings, roomName] = await Promise.all([
    dashboard(payload, now),
    countWaiting(payload),
    countUnplaced(payload),
    applicationSettings(payload),
    roomNameMap(payload),
  ]);

  // ── teendők
  const todos: Todo[] = [];
  if (waiting) todos.push({ text: `Döntésre vár: ${waiting} jelentkezés`, href: '/admin/jelentkezesek', tone: 'warn' });
  const unpaid = apps.workshops
    .filter((w) => w.status !== 'cancelled')
    .flatMap((w) => w.participants)
    // paid on site (marked by staff) or at the checkout: not waiting
    .filter((p) => p.status === 'registered' && !p.paidOffline && !p.paidOnline).length;
  if (unpaid)
    todos.push({
      text: `Fizetésre vár: ${unpaid} Nyitott Műhely résztvevő`,
      href: '/admin/jelentkezesek',
      tone: 'info',
    });
  if (unplaced) todos.push({ text: `Helyszín nélkül: ${unplaced} alkalom`, href: unplacedListHref(now), tone: 'warn' });
  // the next two Nyitott Műhely dates still short of their minimum
  for (const w of apps.workshops.filter((x) => x.status === 'open' && x.taken < x.min).slice(0, 2)) {
    todos.push({
      text: `Nyitott Műhely ${w.when}: ${w.taken}/${w.min} jelentkező — döntés ${w.cutoff}`,
      href: '/admin/jelentkezesek',
      tone: 'info',
    });
  }

  // ── next month: what "Hónap feltöltése" would still create
  const nextMonthDay = addDays(`${todayInBudapest(now).slice(0, 7)}-01`, 40);
  const [y, m] = nextMonthDay.split('-').map(Number) as [number, number];
  const d = settings.workshopDefaults;
  const plan = await planFill(payload, y, m, null, {
    weekday: d.weekday,
    from: daysOfMonth(y, m)[0] ?? '',
    startTime: d.startTime,
    endTime: d.endTime,
    rooms: d.rooms,
  });
  const missing = plan.planned.length + plan.workshops.length;
  const fill = missing ? { month: monthLong(nextMonthDay), count: missing } : null;

  // ── the coming 7 days
  const today = todayInBudapest(now);
  const end = at(addDays(today, 7), '00:00');
  const { docs } = await payload.find({
    collection: 'sessions',
    where: {
      and: [
        { start: { greater_than_equal: at(today, '00:00').toISOString() } },
        { start: { less_than: end.toISOString() } },
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
    limit: 200,
  });
  const days = new Map<string, WeekItem[]>();
  for (const s of docs) {
    const start = new Date(s.start);
    const day = dayOf(start);
    const list = days.get(day) ?? [];
    list.push({
      time: `${clockOf(start)}–${clockOf(new Date(s.end))}`,
      title: String(s.displayTitle ?? SESSION_KINDS[s.kind as SessionKind]),
      kind: s.kind as SessionKind,
      place: placeText(s, roomName) ?? 'helyszín nélkül',
      cancelled: s.status === 'cancelled',
    });
    days.set(day, list);
  }
  const week = [...days].map(([day, items]) => ({
    day,
    label: day === today ? 'Ma' : day === addDays(today, 1) ? 'Holnap' : weekday(day),
    date: `${Number(day.slice(5, 7))}. ${Number(day.slice(8))}.`,
    items,
  }));

  return { todos, fill, week };
}

export type HomeData = Awaited<ReturnType<typeof homeData>>;
