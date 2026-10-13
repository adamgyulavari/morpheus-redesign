import { clockOf, TZ } from './time';

/** "nov. 3., k. 18:00–21:00" (Budapest time) */
export function whenText(start: string | Date, end: string | Date, weekday: 'short' | 'long' = 'short'): string {
  const a = new Date(start);
  const date = new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, month: 'short', day: 'numeric', weekday }).format(a);
  return `${date} ${clockOf(a)}–${clockOf(new Date(end))}`;
}

/** "nov. 3., kedd 18:00" (Budapest time) — a single moment, e.g. a deadline. */
export function momentText(moment: string | Date): string {
  const a = new Date(moment);
  const date = new Intl.DateTimeFormat('hu-HU', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    weekday: 'long',
  }).format(a);
  return `${date} ${clockOf(a)}`;
}
