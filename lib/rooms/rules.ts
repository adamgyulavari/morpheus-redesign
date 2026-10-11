/**
 * Student room-booking rules, as pure functions (no database, no clock): the server gathers the
 * facts (the student's active groups, their bookings this week, the settings, now) and asks here.
 * Staff and admins are not bound by these; the clash guarantee (occupancy.ts) applies to everyone.
 */
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
  /** The student's groups whose last day hasn't passed (id, last day "YYYY-MM-DD"). */
  activeGroups: { id: number; endDate: string }[];
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

export type RuleResult = { ok: true } | { ok: false; reason: string };
const refuse = (reason: string): RuleResult => ({ ok: false, reason });
const OK: RuleResult = { ok: true };

/** 8 → "8", 1.5 → "1,5" */
const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
const huDay = (day: string) => day.replaceAll('-', '. ').concat('.');

/** Can this student book this practice? The first rule broken, in Hungarian. */
export function checkPractice(
  req: PracticeRequest,
  student: StudentContext,
  s: BookingSettings,
  now: Date,
): RuleResult {
  if (!student.activeGroups.length) return refuse('Termet csak aktív kurzusú hallgató foglalhat.');
  if (!req.rooms.length) return refuse('Válassz termet.');
  for (const room of req.rooms) {
    if (!room.active) return refuse(`${room.name} jelenleg nem foglalható.`);
    if (!room.studentBookable) return refuse(`${room.name} diákoknak nem foglalható.`);
  }
  const minutes = (req.end.getTime() - req.start.getTime()) / 60_000;
  if (!(minutes > 0)) return refuse('A foglalás vége legyen a kezdése után.');
  if (minutesOf(req.start) % s.slotMinutes || minutesOf(req.end) % s.slotMinutes) {
    return refuse(
      `A foglalás ${s.slotMinutes} perces egységekben lehetséges (pl. 10:00, 10:${String(s.slotMinutes % 60).padStart(2, '0')}).`,
    );
  }
  if (minutes > s.maxHours * 60) return refuse(`Egyszerre legfeljebb ${num(s.maxHours)} óra foglalható.`);

  if (req.start < now) return refuse('Múltbeli időpontra nem lehet foglalni.');
  if (req.start.getTime() < now.getTime() + s.minNoticeHours * 3_600_000) {
    return refuse(`Legalább ${num(s.minNoticeHours)} órával előre kell foglalni.`);
  }
  const lastDay = addDays(dayOf(now), s.horizonDays);
  if (dayOf(req.start) > lastDay)
    return refuse(`Legfeljebb ${s.horizonDays} nappal előre lehet foglalni (${huDay(lastDay)}-ig).`);

  if (s.hoursFrom && s.hoursTo) {
    const from = clockMinutes(s.hoursFrom);
    const to = clockMinutes(s.hoursTo) || 24 * 60; // "00:00" as the end means midnight
    const endDay = dayOf(new Date(req.end.getTime() - 1));
    const endMinutes = minutesOf(req.end) || 24 * 60;
    if (dayOf(req.start) !== endDay || minutesOf(req.start) < from || endMinutes > to) {
      return refuse(`Diákok ${s.hoursFrom} és ${s.hoursTo} között foglalhatnak.`);
    }
  }

  if (s.weeklyQuotaHours !== null && student.minutesBookedInWeek + minutes > s.weeklyQuotaHours * 60) {
    const left = Math.max(0, s.weeklyQuotaHours * 60 - student.minutesBookedInWeek) / 60;
    return refuse(`A heti keret ${num(s.weeklyQuotaHours)} óra; erre a hétre még ${num(left)} óra maradt.`);
  }

  const lastCourseDay =
    student.activeGroups
      .map((g) => g.endDate)
      .sort()
      .at(-1) ?? '';
  if (dayOf(new Date(req.end.getTime() - 1)) > lastCourseDay) {
    return refuse(`A kurzusod végéig (${huDay(lastCourseDay)}) foglalhatsz.`);
  }

  if (req.courseGroup && req.production) return refuse('Csoportot vagy előadást válassz — csak az egyiket.');
  if (req.courseGroup && !student.activeGroups.some((g) => g.id === req.courseGroup)) {
    return refuse('Csak a saját kurzusodhoz gyakorolhatsz.');
  }
  if (req.production && !student.linkableProductionIds.includes(req.production)) {
    return refuse('Csak a kurzusod előadásaihoz gyakorolhatsz.');
  }
  return OK;
}

/** Can a student cancel their own practice now? */
export function checkCancel(start: Date, s: BookingSettings, now: Date): RuleResult {
  if (start <= now) return refuse('A már elkezdődött foglalást nem lehet lemondani.');
  if (start.getTime() - now.getTime() < s.cancelHoursBefore * 3_600_000) {
    return refuse(`A foglalást legkésőbb ${num(s.cancelHoursBefore)} órával a kezdés előtt lehet lemondani.`);
  }
  return OK;
}
