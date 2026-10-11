import { describe, expect, it } from 'vitest';

import { generatedKey, groupsInMonth, planMonth, type ScheduleGroup } from './generate';

const keddi: ScheduleGroup = {
  id: 7,
  title: 'Keddi szakmai II.',
  startDate: '2026-09-01',
  endDate: '2027-06-30',
  schedule: [{ weekday: 2, startTime: '18:00', endTime: '21:00', rooms: [1] }],
};
const plan = (
  groups: ScheduleGroup[],
  opts: { year?: number; month?: number; closed?: string[]; existing?: string[] } = {},
) =>
  planMonth({
    year: opts.year ?? 2026,
    month: opts.month ?? 11,
    groups,
    closedDays: opts.closed ?? [],
    existing: new Set(opts.existing ?? []),
  });

describe('planMonth', () => {
  it('creates every Tuesday of November at 18:00–21:00 Budapest time in Nagyterem', () => {
    const p = plan([keddi]);
    expect(p.map((s) => s.day)).toEqual(['2026-11-03', '2026-11-10', '2026-11-17', '2026-11-24']);
    // winter time (CET, UTC+1)
    expect(p[0]).toMatchObject({ courseGroup: 7, entry: 0, rooms: [1] });
    expect(p[0]?.start.toISOString()).toBe('2026-11-03T17:00:00.000Z');
    expect(p[0]?.end.toISOString()).toBe('2026-11-03T20:00:00.000Z');
  });

  it('skips closed days', () => {
    expect(plan([keddi], { closed: ['2026-11-10'] }).map((s) => s.day)).toEqual([
      '2026-11-03',
      '2026-11-17',
      '2026-11-24',
    ]);
  });

  it('is idempotent: dates generated before (even if moved or cancelled since) are skipped', () => {
    const first = plan([keddi]);
    const existing = first.map((s) => generatedKey(s.courseGroup, s.entry, s.day));
    expect(plan([keddi], { existing })).toEqual([]);
    expect(plan([keddi], { existing: existing.slice(1) }).map((s) => s.day)).toEqual(['2026-11-03']);
  });

  it('stays within the group’s first and last day', () => {
    const late = { ...keddi, startDate: '2026-11-15', endDate: '2026-11-20' };
    expect(plan([late]).map((s) => s.day)).toEqual(['2026-11-17']);
  });

  it('handles several schedule entries per group, sorted by time', () => {
    const twice = {
      ...keddi,
      schedule: [
        { weekday: 4, startTime: '17:00', endTime: '19:00', rooms: [2] },
        { weekday: 2, startTime: '18:00', endTime: '21:00', rooms: [1] },
      ],
    };
    const p = plan([twice]);
    expect(p).toHaveLength(8);
    expect(p.slice(0, 2).map((s) => [s.day, s.entry])).toEqual([
      ['2026-11-03', 1],
      ['2026-11-05', 0],
    ]);
  });

  it('keeps the Budapest clock time across the autumn DST change', () => {
    const sunday = { ...keddi, schedule: [{ weekday: 7, startTime: '18:00', endTime: '20:00', rooms: [1] }] };
    const p = plan([sunday], { month: 10 });
    const byDay = Object.fromEntries(p.map((s) => [s.day, s.start.toISOString()]));
    expect(byDay['2026-10-18']).toBe('2026-10-18T16:00:00.000Z'); // summer time, UTC+2
    expect(byDay['2026-10-25']).toBe('2026-10-25T17:00:00.000Z'); // the change day itself, winter time
    expect(p.every((s) => s.end.getTime() - s.start.getTime() === 2 * 3_600_000)).toBe(true);
  });

  it('keeps the Budapest clock time across the spring DST change', () => {
    const sunday = {
      ...keddi,
      startDate: '2027-01-01',
      schedule: [{ weekday: 7, startTime: '01:30', endTime: '04:00', rooms: [1] }],
    };
    const p = plan([sunday], { year: 2027, month: 3 });
    const change = p.find((s) => s.day === '2027-03-28');
    // 28 Mar 2027: 02:00 CET → 03:00 CEST; 01:30–04:00 on the clock is 1.5 real hours
    expect(change?.start.toISOString()).toBe('2027-03-28T00:30:00.000Z');
    expect(change?.end.toISOString()).toBe('2027-03-28T02:00:00.000Z');
  });
});

describe('groupsInMonth', () => {
  it('selects the groups running in the month', () => {
    const groups = [
      { id: 1, startDate: '2026-09-01', endDate: '2026-10-31' },
      { id: 2, startDate: '2026-10-15', endDate: '2026-11-01' },
      { id: 3, startDate: '2026-11-30', endDate: '2027-01-31' },
      { id: 4, startDate: '2026-12-01', endDate: '2027-01-31' },
    ];
    expect(groupsInMonth(groups, 2026, 11).map((g) => g.id)).toEqual([2, 3]);
  });
});
