import { relIds } from '@/payload/rel';

import { LOCATION_TYPES } from './labels';

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

/** What `placeText` needs of a session. */
export type Placed = { locationType?: string | null; rooms?: unknown; externalLocation?: string | null };

/**
 * Where a session is: its rooms ("Nagyterem, Próbaterem"), the external venue ("Külső helyszín"
 * when it isn't named — it is told to those concerned), or undefined while it has no place (each
 * caller words that its own way).
 */
export function placeText(s: Placed, roomName: ReadonlyMap<number, string>): string | undefined {
  if (s.locationType === 'room')
    return (
      relIds(s.rooms)
        .map((id) => roomName.get(id))
        .filter(Boolean)
        .join(', ') || undefined
    );
  if (s.locationType === 'external') return s.externalLocation?.trim() || LOCATION_TYPES.external;
  return undefined;
}
