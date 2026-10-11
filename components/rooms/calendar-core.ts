/**
 * Shared FullCalendar setup and helpers for the room calendars (free MIT plugins only).
 * Hungarian, Monday-first, 24-hour, 30-minute slots, shown in Budapest time whatever the
 * browser's zone (Luxon plugin), opening at 08:00 with the whole day reachable by scrolling.
 */
import type { CalendarOptions, EventInput } from '@fullcalendar/core';
import huLocale from '@fullcalendar/core/locales/hu';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import luxonPlugin from '@fullcalendar/luxon3';
import timeGridPlugin from '@fullcalendar/timegrid';

import { BOOKING_KINDS, KIND_COLORS, SESSION_KINDS } from '@/lib/rooms/labels';
import type { ScheduleEvent } from '@/lib/rooms/server';
import { TZ } from '@/lib/rooms/time';

export type CalRoom = { id: number; name: string; color?: string; studentBookable?: boolean };

export const baseOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, luxonPlugin],
  locale: huLocale,
  timeZone: TZ,
  firstDay: 1,
  slotDuration: '00:30:00',
  snapDuration: '00:30:00',
  slotMinTime: '00:00:00',
  slotMaxTime: '24:00:00',
  scrollTime: '08:00:00',
  slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  allDaySlot: false,
  nowIndicator: true,
  expandRows: false,
  dayMaxEvents: 4,
};

/** What is happening, in one line: "Keddi szakmai II.", "Gyakorlás — Teszt Anna · Az ördög". */
export function eventLabel(e: ScheduleEvent, ownLabel = 'Saját foglalás'): { title: string; meta?: string } {
  if (e.kind === 'practice') {
    return { title: e.own ? ownLabel : `${BOOKING_KINDS.practice} — ${e.booker ?? ''}`, meta: e.owner?.title };
  }
  if (e.kind === 'session') {
    return {
      title: e.title,
      meta: e.sessionKind && e.sessionKind !== 'course' ? SESSION_KINDS[e.sessionKind] : e.owner?.title,
    };
  }
  return { title: e.title, meta: BOOKING_KINDS[e.kind] };
}

/** ScheduleEvent → FullCalendar event; colour by kind, or by room in "all rooms". */
export function toCalendarEvent(
  e: ScheduleEvent,
  opts: { colorByRoom?: Map<number, string>; editable?: boolean } = {},
): EventInput {
  const kindColor =
    e.kind === 'session'
      ? KIND_COLORS[e.sessionKind ?? 'other']
      : KIND_COLORS[e.kind as 'practice' | 'rental' | 'other'];
  const roomColor = opts.colorByRoom?.get(e.roomIds[0] ?? -1);
  const color = roomColor ?? kindColor;
  return {
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: color,
    borderColor: color,
    textColor: e.kind === 'practice' && !roomColor ? '#10292c' : '#fffaf2',
    editable: opts.editable ?? false,
    classNames: e.own ? ['is-own'] : [],
    extendedProps: { event: e },
  };
}
