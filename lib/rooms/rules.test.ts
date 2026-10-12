import { describe, expect, it } from 'vitest';

import {
  type BookingSettings,
  checkCancel,
  checkPractice,
  DEFAULT_SETTINGS,
  type PracticeRequest,
  type RoomInfo,
  type StudentContext,
  settingsFrom,
} from './rules';
import { at } from './time';

const now = at('2026-11-02', '09:00'); // a Monday morning
const nagyterem: RoomInfo = { id: 1, name: 'Nagyterem', active: true, studentBookable: true };
const iroda: RoomInfo = { id: 3, name: 'Iroda', active: true, studentBookable: false };
const closedRoom: RoomInfo = { id: 4, name: 'Pince', active: false, studentBookable: true };
const student: StudentContext = {
  activeGroups: [{ id: 1, endDate: '2027-06-30' }],
  permitted: false,
  linkableProductionIds: [10],
  minutesBookedInWeek: 0,
};

const practice = (day: string, from: string, to: string, extra: Partial<PracticeRequest> = {}): PracticeRequest => ({
  start: at(day, from),
  end: at(day, to),
  rooms: [nagyterem],
  ...extra,
});
const check = (req: PracticeRequest, ctx: Partial<StudentContext> = {}, s: Partial<BookingSettings> = {}, when = now) =>
  checkPractice(req, { ...student, ...ctx }, { ...DEFAULT_SETTINGS, ...s }, when);
const reason = (r: ReturnType<typeof check>) => (r.ok ? 'ok' : r.reason);

describe('checkPractice', () => {
  it('accepts 8 hours within 30 days, linked to the own course', () => {
    expect(check(practice('2026-11-20', '10:00', '18:00', { courseGroup: 1 }))).toEqual({ ok: true });
  });

  it('refuses more than the maximum length', () => {
    expect(reason(check(practice('2026-11-20', '10:00', '19:00')))).toBe('Egyszerre legfeljebb 8 óra foglalható.');
  });

  it('allows the last day of the horizon, refuses the day after', () => {
    expect(check(practice('2026-12-02', '10:00', '12:00')).ok).toBe(true); // today + 30
    expect(reason(check(practice('2026-12-03', '10:00', '12:00')))).toContain('Legfeljebb 30 nappal előre');
  });

  it('refuses someone without an active course or a permission', () => {
    expect(reason(check(practice('2026-11-20', '10:00', '12:00'), { activeGroups: [] }))).toContain(
      'Teremfoglalásra most nincs jogosultságod',
    );
  });

  it('a permission allows booking without a course, with no end date', () => {
    expect(
      check(practice('2026-11-20', '10:00', '12:00'), { activeGroups: [], linkableProductionIds: [], permitted: true })
        .ok,
    ).toBe(true);
    const ended = { activeGroups: [{ id: 1, endDate: '2026-11-10' }], permitted: true };
    expect(check(practice('2026-11-20', '10:00', '12:00'), ended).ok).toBe(true);
  });

  it('only links the own course or its productions', () => {
    expect(reason(check(practice('2026-11-20', '10:00', '12:00', { courseGroup: 2 })))).toBe(
      'Csak a saját kurzusodhoz gyakorolhatsz.',
    );
    expect(reason(check(practice('2026-11-20', '10:00', '12:00', { production: 11 })))).toBe(
      'Csak a kurzusod előadásaihoz gyakorolhatsz.',
    );
    expect(check(practice('2026-11-20', '10:00', '12:00', { production: 10 })).ok).toBe(true);
    expect(reason(check(practice('2026-11-20', '10:00', '12:00', { courseGroup: 1, production: 10 })))).toContain(
      'csak az egyiket',
    );
  });

  it('refuses the past and respects the minimum notice', () => {
    expect(reason(check(practice('2026-11-01', '10:00', '12:00')))).toBe('Múltbeli időpontra nem lehet foglalni.');
    expect(reason(check(practice('2026-11-02', '10:00', '12:00'), {}, { minNoticeHours: 2 }))).toBe(
      'Legalább 2 órával előre kell foglalni.',
    );
    expect(check(practice('2026-11-02', '11:00', '12:00'), {}, { minNoticeHours: 2 }).ok).toBe(true);
  });

  it('keeps to the slot size', () => {
    expect(reason(check(practice('2026-11-20', '10:15', '12:00')))).toContain('30 perces egységekben');
    expect(check(practice('2026-11-20', '10:15', '12:00'), {}, { slotMinutes: 15 }).ok).toBe(true);
  });

  it('refuses rooms students may not book, and inactive rooms', () => {
    expect(reason(check(practice('2026-11-20', '10:00', '12:00', { rooms: [nagyterem, iroda] })))).toBe(
      'Iroda diákoknak nem foglalható.',
    );
    expect(reason(check(practice('2026-11-20', '10:00', '12:00', { rooms: [closedRoom] })))).toBe(
      'Pince jelenleg nem foglalható.',
    );
  });

  it('applies the weekly quota', () => {
    const quota = { weeklyQuotaHours: 4 };
    expect(reason(check(practice('2026-11-20', '10:00', '12:00'), { minutesBookedInWeek: 180 }, quota))).toBe(
      'A heti keret 4 óra; erre a hétre még 1 óra maradt.',
    );
    expect(check(practice('2026-11-20', '10:00', '11:00'), { minutesBookedInWeek: 180 }, quota).ok).toBe(true);
  });

  it('applies the daily window, also with midnight as its end', () => {
    const window = { hoursFrom: '08:00', hoursTo: '22:00' };
    expect(check(practice('2026-11-20', '20:00', '22:00'), {}, window).ok).toBe(true);
    expect(reason(check(practice('2026-11-20', '21:00', '23:00'), {}, window))).toBe(
      'Diákok 08:00 és 22:00 között foglalhatnak.',
    );
    expect(
      reason(
        check({ start: at('2026-11-20', '23:00'), end: at('2026-11-21', '01:00'), rooms: [nagyterem] }, {}, window),
      ),
    ).toContain('között foglalhatnak');
    expect(
      check(
        { start: at('2026-11-20', '22:00'), end: at('2026-11-21', '00:00'), rooms: [nagyterem] },
        {},
        { hoursFrom: '08:00', hoursTo: '00:00' },
      ).ok,
    ).toBe(true);
  });

  it('only until the end of the student’s latest course', () => {
    const ctx = { activeGroups: [{ id: 1, endDate: '2026-11-10' }] };
    expect(check(practice('2026-11-10', '10:00', '12:00'), ctx).ok).toBe(true);
    expect(reason(check(practice('2026-11-11', '10:00', '12:00'), ctx))).toBe(
      'A kurzusod végéig (2026. 11. 10.) foglalhatsz.',
    );
  });

  it('measures length in real time across the autumn DST change', () => {
    // 25 Oct 2026: 03:00 CEST → 02:00 CET, so 01:00–04:00 on the clock is 4 real hours
    const night = { start: at('2026-10-25', '01:00'), end: at('2026-10-25', '04:00'), rooms: [nagyterem] };
    expect(night.end.getTime() - night.start.getTime()).toBe(4 * 3_600_000);
    const october = at('2026-10-20', '09:00');
    expect(reason(check(night, {}, { maxHours: 3 }, october))).toBe('Egyszerre legfeljebb 3 óra foglalható.');
    expect(check(night, {}, { maxHours: 4 }, october).ok).toBe(true);
  });
});

describe('checkCancel', () => {
  const start = at('2026-11-20', '10:00');
  it('until the start by default', () => {
    expect(checkCancel(start, DEFAULT_SETTINGS, at('2026-11-20', '09:59')).ok).toBe(true);
    expect(checkCancel(start, DEFAULT_SETTINGS, at('2026-11-20', '10:00')).ok).toBe(false);
  });
  it('with a notice period', () => {
    const s = { ...DEFAULT_SETTINGS, cancelHoursBefore: 24 };
    expect(checkCancel(start, s, at('2026-11-19', '09:00')).ok).toBe(true);
    expect(reason(checkCancel(start, s, at('2026-11-19', '11:00')))).toBe(
      'A foglalást legkésőbb 24 órával a kezdés előtt lehet lemondani.',
    );
  });
});

describe('settingsFrom', () => {
  it('fills in defaults and ignores a half-set daily window', () => {
    expect(settingsFrom(null)).toEqual(DEFAULT_SETTINGS);
    expect(settingsFrom({ studentHoursFrom: '08:00' }).hoursFrom).toBeNull();
  });
  it('reads the settings global', () => {
    const s = settingsFrom({
      studentHoursFrom: '08:00',
      studentHoursTo: '22:00',
      slotMinutes: '15',
      maxHours: 4,
      weeklyQuotaHours: 10,
      closedDates: [{ date: at('2026-12-24', '12:00').toISOString() }],
    });
    expect(s).toMatchObject({
      hoursFrom: '08:00',
      hoursTo: '22:00',
      slotMinutes: 15,
      maxHours: 4,
      weeklyQuotaHours: 10,
      closedDays: ['2026-12-24'],
    });
  });
});
