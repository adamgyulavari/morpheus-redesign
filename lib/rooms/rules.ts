/**
 * Student room-booking rules, as pure functions (no database, no clock): the server gathers the
 * facts (their permission, their groups, their bookings this week, the settings, now) and asks here.
 *
 * Who may book: only those staff gave the "Teremfoglalás engedélyezve" permission (`users.roomBooking`).
 * Being in a course doesn't allow it, nor does registering; the groups only decide what practice
 * may be "for".
 * Staff and admins are not bound by these; the clash guarantee (occupancy.ts) applies to everyone.
 */
import type { Refusal, Values } from '@/lib/messages';
import type { UiStrings } from '@/payload/ui-catalogue';

import { addDays, clockMinutes, dayOf, minutesOf } from './time';

export type BookingSettings = {
  /** Daily window for students ("HH:mm"); both empty = around the clock. */
  hoursFrom: string | null;
  hoursTo: string | null;
  slotMinutes: number;
  maxHours: number;
  horizonDays: number;
  minNoticeHours: number;
  /** Per student per week (Mon–Sun); null = unlimited. */
  weeklyQuotaHours: number | null;
  /** 0 = until the start. */
  cancelHoursBefore: number;
  /** "YYYY-MM-DD" days on which fill month generates nothing. */
  closedDays: string[];
};

export const DEFAULT_SETTINGS: BookingSettings = {
  hoursFrom: null,
  hoursTo: null,
  slotMinutes: 30,
  maxHours: 8,
  horizonDays: 30,
  minNoticeHours: 0,
  weeklyQuotaHours: null,
  cancelHoursBefore: 0,
  closedDays: [],
};

/** The roomBookingSettings global → settings (empty values → defaults). */
export function settingsFrom(doc: Record<string, unknown> | null | undefined): BookingSettings {
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const clock = (v: unknown) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : null);
  const from = clock(doc?.studentHoursFrom);
  const to = clock(doc?.studentHoursTo);
  return {
    hoursFrom: from && to ? from : null,
    hoursTo: from && to ? to : null,
    slotMinutes: Number(doc?.slotMinutes) || DEFAULT_SETTINGS.slotMinutes,
    maxHours: num(doc?.maxHours, DEFAULT_SETTINGS.maxHours),
    horizonDays: num(doc?.horizonDays, DEFAULT_SETTINGS.horizonDays),
    minNoticeHours: num(doc?.minNoticeHours, DEFAULT_SETTINGS.minNoticeHours),
    weeklyQuotaHours: typeof doc?.weeklyQuotaHours === 'number' ? doc.weeklyQuotaHours : null,
    cancelHoursBefore: num(doc?.cancelHoursBefore, DEFAULT_SETTINGS.cancelHoursBefore),
    closedDays: Array.isArray(doc?.closedDates)
      ? (doc.closedDates as { date?: string }[]).flatMap((d) => (d.date ? [dayOf(new Date(d.date))] : []))
      : [],
  };
}

export type RoomInfo = { id: number; name: string; active: boolean; studentBookable: boolean };

export type StudentContext = {
  /** Staff allowed room booking for this user (`users.roomBooking`) — the only way to book. */
  permitted: boolean;
  /** The student's groups that haven't ended (practice may be "for" them). */
  groupIds: number[];
  /** Productions linked to those groups (their rehearsals; practice may be "for" them). */
  linkableProductionIds: number[];
  /** Minutes of the student's other confirmed practice in the booking's week. */
  minutesBookedInWeek: number;
};

export type PracticeRequest = {
  start: Date;
  end: Date;
  rooms: RoomInfo[];
  courseGroup?: number | null;
  production?: number | null;
};

/** A no: a text of Felületi szövegek → Üzenetek → Teremfoglalási szabályok (lib/messages.ts). */
export type RuleResult = { ok: true } | Refusal<keyof UiStrings['roomRules']>;
const refuse = (refusal: keyof UiStrings['roomRules'], values?: Values): RuleResult => ({ ok: false, refusal, values });
const OK: RuleResult = { ok: true };

/** 8 → "8", 1.5 → "1,5" */
const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
const huDay = (day: string) => day.replaceAll('-', '. ').concat('.');

/** Can this student book this practice? The first rule broken. */
export function checkPractice(
  req: PracticeRequest,
  student: StudentContext,
  s: BookingSettings,
  now: Date,
): RuleResult {
  if (!student.permitted) {
    return refuse('notPermitted');
  }
  if (!req.rooms.length) return refuse('chooseRoom');
  for (const room of req.rooms) {
    if (!room.active) return refuse('roomInactive', { room: room.name });
    if (!room.studentBookable) return refuse('roomNotForStudents', { room: room.name });
  }
  const minutes = (req.end.getTime() - req.start.getTime()) / 60_000;
  if (!(minutes > 0)) return refuse('endBeforeStart');
  if (minutesOf(req.start) % s.slotMinutes || minutesOf(req.end) % s.slotMinutes) {
    return refuse('slot', {
      minutes: s.slotMinutes,
      example: `10:00, 10:${String(s.slotMinutes % 60).padStart(2, '0')}`,
    });
  }
  if (minutes > s.maxHours * 60) return refuse('maxHours', { hours: num(s.maxHours) });

  if (req.start < now) return refuse('past');
  if (req.start.getTime() < now.getTime() + s.minNoticeHours * 3_600_000) {
    return refuse('notice', { hours: num(s.minNoticeHours) });
  }
  const lastDay = addDays(dayOf(now), s.horizonDays);
  if (dayOf(req.start) > lastDay) return refuse('horizon', { days: s.horizonDays, day: huDay(lastDay).slice(0, -1) });

  if (s.hoursFrom && s.hoursTo) {
    const from = clockMinutes(s.hoursFrom);
    const to = clockMinutes(s.hoursTo) || 24 * 60; // "00:00" as the end means midnight
    const endDay = dayOf(new Date(req.end.getTime() - 1));
    const endMinutes = minutesOf(req.end) || 24 * 60;
    if (dayOf(req.start) !== endDay || minutesOf(req.start) < from || endMinutes > to) {
      return refuse('hours', { from: s.hoursFrom, to: s.hoursTo });
    }
  }

  if (s.weeklyQuotaHours !== null && student.minutesBookedInWeek + minutes > s.weeklyQuotaHours * 60) {
    const left = Math.max(0, s.weeklyQuotaHours * 60 - student.minutesBookedInWeek) / 60;
    return refuse('quota', { quota: num(s.weeklyQuotaHours), left: num(left) });
  }

  if (req.courseGroup && req.production) return refuse('oneLink');
  if (req.courseGroup && !student.groupIds.includes(req.courseGroup)) {
    return refuse('ownCourse');
  }
  if (req.production && !student.linkableProductionIds.includes(req.production)) {
    return refuse('ownProduction');
  }
  return OK;
}

/** Can a student cancel their own practice now? */
export function checkCancel(start: Date, s: BookingSettings, now: Date): RuleResult {
  if (start <= now) return refuse('started');
  if (start.getTime() - now.getTime() < s.cancelHoursBefore * 3_600_000) {
    return refuse('cancelDeadline', { hours: num(s.cancelHoursBefore) });
  }
  return OK;
}
