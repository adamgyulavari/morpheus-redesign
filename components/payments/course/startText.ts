import { monthDayShort, weekday } from '@/lib/dates';
import { fill } from '@/lib/format';
import type { CourseStart, UiStrings } from '@/lib/types';

type Texts = Pick<UiStrings, 'signup' | 'sessions'>;

/** "okt. 25., szombat" */
const startDay = (s: CourseStart) => `${monthDayShort(s.date)}, ${weekday(s.date)}`;

/** "Indul: okt. 25., szombat · 10:00–13:00" */
export const startLine = (s: CourseStart, ui: Texts) =>
  s.startTime
    ? fill(ui.signup.startsAt, { date: startDay(s), time: `${s.startTime}–${s.endTime}` })
    : fill(ui.signup.starts, { date: startDay(s) });

/** "Kezdő 2026 ősz — indul: okt. 25., szombat" */
export const groupLabel = (s: CourseStart, ui: Texts) =>
  fill(ui.signup.groupLabel, { title: s.title, date: startDay(s) });

/** "8 szabad hely", or nothing without a limit. */
export const placesLeft = (s: CourseStart, ui: Texts) =>
  s.signup.left != null ? fill(ui.sessions.left, { count: s.signup.left }) : '';
