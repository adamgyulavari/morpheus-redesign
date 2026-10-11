/**
 * "Hónap feltöltése": which course sessions a month needs, from the groups' weekly schedules.
 * Pure: the server passes in the groups, the closed days and what was generated before, and then
 * creates the planned sessions (and tries to book their rooms).
 */
import { at, daysOfMonth, weekdayOf } from './time';

export type ScheduleEntry = { weekday: number; startTime: string; endTime: string; rooms: number[] };
export type ScheduleGroup = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  schedule: ScheduleEntry[];
};

export type PlannedSession = {
  courseGroup: number;
  title: string;
  /** Index of the schedule entry, with `day` the identity of a generated session. */
  entry: number;
  day: string;
  start: Date;
  end: Date;
  rooms: number[];
};

/** "groupId:entry:day" of every session generated before — moved, customized or cancelled ones too. */
export const generatedKey = (courseGroup: number, entry: number, day: string) => `${courseGroup}:${entry}:${day}`;

/** Groups running at any time in the month (the default selection). */
export function groupsInMonth<G extends { startDate: string; endDate: string }>(
  groups: G[],
  year: number,
  month: number,
): G[] {
  const days = daysOfMonth(year, month);
  const first = days[0] ?? '';
  const last = days.at(-1) ?? '';
  return groups.filter((g) => g.startDate <= last && g.endDate >= first);
}

export function planMonth({
  year,
  month,
  groups,
  closedDays,
  existing,
}: {
  year: number;
  month: number;
  groups: ScheduleGroup[];
  closedDays: Iterable<string>;
  existing: Set<string>;
}): PlannedSession[] {
  const closed = new Set(closedDays);
  const planned: PlannedSession[] = [];
  for (const day of daysOfMonth(year, month)) {
    if (closed.has(day)) continue;
    const weekday = weekdayOf(day);
    for (const group of groups) {
      if (day < group.startDate || day > group.endDate) continue;
      group.schedule.forEach((entry, i) => {
        if (entry.weekday !== weekday || existing.has(generatedKey(group.id, i, day))) return;
        planned.push({
          courseGroup: group.id,
          title: group.title,
          entry: i,
          day,
          start: at(day, entry.startTime),
          end: at(day, entry.endTime),
          rooms: entry.rooms,
        });
      });
    }
  }
  return planned.sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title, 'hu'));
}
