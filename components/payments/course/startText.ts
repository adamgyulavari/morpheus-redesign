import { monthDayShort, weekday } from '@/lib/dates';
import type { CourseStart } from '@/lib/types';

/** "Indul: okt. 25., szombat · 10:00–13:00" */
export const startLine = (s: CourseStart) =>
  `Indul: ${monthDayShort(s.date)}, ${weekday(s.date)}${s.startTime ? ` · ${s.startTime}–${s.endTime}` : ''}`;

/** "Kezdő 2026 ősz — indul: okt. 25., szombat" */
export const groupLabel = (s: CourseStart) => `${s.title} — indul: ${monthDayShort(s.date)}, ${weekday(s.date)}`;

export const placesLeft = (s: CourseStart) => (s.signup.left != null ? `${s.signup.left} szabad hely` : '');
