/**
 * Importing course groups and their members (Csoportok → Importálás fájlból): what the file's
 * groups become, decided here (pure, tested), applied by importGroups.
 *
 * - the type from the name ("kezdő" → Kezdő, "szakmai" → Szakmai, "társulat" → Társulat, else Egyéb)
 * - a weekly slot from the weekday and start time: kezdő 2 hours, everything else 3; a társulat
 *   has none (its sessions are made by hand)
 * - dates: this year (Jan 1 – Dec 31); without a start time the group is over (it ended at the end
 *   of last month); a társulat has none
 * - members by e-mail: their account, or a new unverified one (no e-mail); the name is
 *   "Vezetéknév Keresztnév"
 */
import type { Payload } from 'payload';
import { todayInBudapest } from '@/lib/dates';
import { relIds } from '@/payload/rel';
import type { CourseGroup } from '@/payload-types';

import { type Applicant, sendAccepted } from './notify';
import { applicantFor, courseInfo } from './server';
import { applicationSettings } from './settings';

export type ImportFile = {
  groups: { name: string; weekday?: string; startTime?: string; members: { name: string; email: string }[] }[];
};

export type GroupType = 'kezdo' | 'szakmai' | 'tarsulat' | 'egyeb';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function typeOf(name: string): GroupType {
  const n = name.toLowerCase();
  if (n.includes('kezdő') || n.includes('kezdo')) return 'kezdo';
  if (n.includes('szakmai')) return 'szakmai';
  if (n.includes('társulat') || n.includes('tarsulat')) return 'tarsulat';
  return 'egyeb';
}

/** Hours of a session: kezdő 2, the others 3. */
export const hoursOf = (type: GroupType) => (type === 'kezdo' ? 2 : 3);

/** "18:00" + 3 → "21:00" (within the day). */
export function addHours(clock: string, hours: number): string {
  const [h, m] = clock.split(':').map(Number) as [number, number];
  const end = Math.min(24 * 60 - 1, h * 60 + m + hours * 60);
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
}

/** "Monday" → "1" … "Sunday" → "7" (the schedule's weekday). */
type Weekday = NonNullable<CourseGroup['defaultSchedule']>[number]['weekday'];

export function weekdayOf(name: string | undefined): Weekday | null {
  const i = WEEKDAYS.indexOf((name ?? '').trim().toLowerCase());
  return i < 0 ? null : (String(i + 1) as Weekday);
}

/** The file's text as an import, or what is wrong with it. */
export function parseImportFile(text: string): ImportFile | string {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return 'A fájl nem érvényes JSON.';
  }
  const groups = (data as ImportFile | null)?.groups;
  if (!Array.isArray(groups)) return 'A fájlban nincs „groups” lista.';
  const bad = groups.findIndex((g) => typeof g?.name !== 'string' || !g.name.trim() || !Array.isArray(g.members));
  if (bad >= 0) return `A(z) ${bad + 1}. csoportnak nincs neve vagy „members” listája.`;
  return { groups };
}

const isClock = (v: string | undefined): v is string => Boolean(v && /^\d{1,2}:\d{2}$/.test(v.trim()));

/** The group's dates: this year; over (no start time): until the end of last month; a társulat: none. */
export function datesOf(type: GroupType, running: boolean, today: string): { startDate?: string; endDate?: string } {
  if (type === 'tarsulat') return {};
  const year = today.slice(0, 4);
  if (running) return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  // the day before the 1st of this month
  const firstOfMonth = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
  const lastMonthEnd = new Date(firstOfMonth.getTime() - 86_400_000).toISOString().slice(0, 10);
  return { startDate: `${year}-01-01`, endDate: lastMonthEnd };
}

/** "Kiss Anna Mária" → Kiss / Anna Mária (Hungarian order: the family name first). */
export function splitName(full: string): { lastName: string; firstName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { lastName: parts[0] ?? '', firstName: '-' };
  // a title stays with the family name: "Dr. Kiss Anna"
  const take = /^(dr|id|ifj|özv)\.?$/i.test(parts[0] ?? '') ? 2 : 1;
  return { lastName: parts.slice(0, take).join(' '), firstName: parts.slice(take).join(' ') || '-' };
}

export type PlannedGroup = {
  title: string;
  type: GroupType;
  startDate?: string;
  endDate?: string;
  schedule: { weekday: Weekday; startTime: string; endTime: string } | null;
  members: { email: string; lastName: string; firstName: string }[];
};

export function planGroups(file: ImportFile, today: string): PlannedGroup[] {
  return file.groups.map((g) => {
    const type = typeOf(g.name);
    const weekday = weekdayOf(g.weekday);
    const running = isClock(g.startTime) && Boolean(weekday);
    const slot = running && type !== 'tarsulat';
    return {
      title: g.name.trim(),
      type,
      ...datesOf(type, running, today),
      schedule:
        slot && weekday && g.startTime
          ? {
              weekday,
              startTime: g.startTime.trim().padStart(5, '0'),
              endTime: addHours(g.startTime.trim(), hoursOf(type)),
            }
          : null,
      members: g.members
        .filter((m) => m.email?.trim())
        .map((m) => ({ email: m.email.trim().toLowerCase(), ...splitName(m.name) })),
    };
  });
}

export type ImportResult = {
  groups: (Omit<PlannedGroup, 'members'> & { created: boolean; added: number; members: number })[];
  accountsCreated: number;
  emailsSent: number;
};

/**
 * Applies the plan: each group by its title (created, or updated — its type, dates and slot from
 * the file; members are only added), each member's account. `email`: the newly added members get
 * the "Felvétel a kurzusba" e-mail with a login link (not for a group that has ended). `dryRun`: nothing is written.
 */
export async function importGroups(
  payload: Payload,
  plan: PlannedGroup[],
  o: { roomIds: number[]; email: boolean; dryRun: boolean },
): Promise<ImportResult> {
  const result: ImportResult = { groups: [], accountsCreated: 0, emailsSent: 0 };
  const courses = (await payload.find({ collection: 'courses', depth: 0, limit: 0, pagination: false })).docs;
  const courseOf = (type: GroupType) =>
    courses.find((c) => c.signupMode === (type === 'kezdo' ? 'beginner' : type === 'szakmai' ? 'professional' : ''))
      ?.id ?? null;
  const settings = await applicationSettings(payload);
  const ctx = { disableRevalidate: true };

  for (const g of plan) {
    const existing = (
      await payload.find({ collection: 'courseGroups', where: { title: { equals: g.title } }, depth: 0, limit: 1 })
    ).docs[0];
    const students = new Set(relIds(existing?.students));
    const joined: Applicant[] = [];
    for (const m of g.members) {
      if (o.dryRun) {
        const user = (await payload.find({ collection: 'users', where: { email: { equals: m.email } }, limit: 1 }))
          .docs[0];
        if (!user) result.accountsCreated++;
        if (!user || !students.has(user.id)) joined.push({ userId: 0, name: '', email: m.email });
        continue;
      }
      const { applicant, created } = await applicantFor(payload, null, { ...m, phone: '' });
      if (created) result.accountsCreated++;
      if (!students.has(applicant.userId)) {
        students.add(applicant.userId);
        joined.push(applicant);
      }
    }
    const data = {
      title: g.title,
      type: g.type,
      course: courseOf(g.type),
      startDate: g.startDate ?? null,
      endDate: g.endDate ?? null,
      defaultSchedule: g.schedule ? [{ ...g.schedule, rooms: o.roomIds }] : [],
      students: [...students],
    };
    let doc = existing;
    if (!o.dryRun)
      doc = existing
        ? await payload.update({ collection: 'courseGroups', id: existing.id, data, context: ctx })
        : await payload.create({ collection: 'courseGroups', data: data as never, context: ctx });
    const { members: _, ...planned } = g;
    result.groups.push({
      ...planned,
      created: !existing,
      added: joined.length,
      members: students.size + (o.dryRun ? joined.length : 0),
    });

    // an ended group's members aren't welcomed
    const over = Boolean(g.endDate && g.endDate < todayInBudapest());
    if (o.email && !o.dryRun && doc && !over)
      for (const a of joined) {
        await sendAccepted(payload, settings, a, courseInfo(doc));
        result.emailsSent++;
      }
  }
  return result;
}
