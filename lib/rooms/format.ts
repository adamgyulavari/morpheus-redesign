import { clockOf, TZ } from './time';

/** "nov. 3., k. 18:00–21:00" (Budapest time) */
export function whenText(start: string | Date, end: string | Date, weekday: 'short' | 'long' = 'short'): string {
  const a = new Date(start);
  const date = new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, month: 'short', day: 'numeric', weekday }).format(a);
  return `${date} ${clockOf(a)}–${clockOf(new Date(end))}`;
}
