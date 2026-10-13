/** Names and colours of session and booking kinds — the admin, the calendars and the e-mails share them. */

export const SESSION_KINDS = {
  course: 'Óra',
  rehearsal: 'Próba',
  exam: 'Vizsga',
  show: 'Előadás',
  workshop: 'Nyitott Műhely',
  other: 'Egyéb',
} as const;
export type SessionKind = keyof typeof SESSION_KINDS;

export const BOOKING_KINDS = {
  session: 'Alkalom',
  practice: 'Gyakorlás',
  rental: 'Bérlés',
  other: 'Egyéb',
} as const;
export type BookingKind = keyof typeof BOOKING_KINDS;

export const LOCATION_TYPES = {
  room: 'Terem',
  external: 'Külső helyszín',
  unplaced: 'Helyszín nélkül',
} as const;
export type LocationType = keyof typeof LOCATION_TYPES;

export const WEEKDAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'] as const;

/**
 * Colours by what is happening (site palette): `fill` behind white text (the calendars' events),
 * `ink` for text and icons on cream (AA), `tint` for light backgrounds.
 */
export const KIND_PALETTE: Record<
  SessionKind | Exclude<BookingKind, 'session'>,
  { fill: string; ink: string; tint: string }
> = {
  course: { fill: '#0f5f63', ink: '#0f5f63', tint: '#e1ecea' },
  rehearsal: { fill: '#6b4c9a', ink: '#5c3f8a', tint: '#ebe4f3' },
  exam: { fill: '#b8472a', ink: '#9a3b22', tint: '#f3dfd6' },
  show: { fill: '#c24e2c', ink: '#b8472a', tint: '#f6e2d9' },
  workshop: { fill: '#2f6b4f', ink: '#2f6b4f', tint: '#e0ece4' },
  other: { fill: '#4d6366', ink: '#4d6366', tint: '#e9e6df' },
  practice: { fill: '#d9a441', ink: '#8a6414', tint: '#f6ead0' },
  rental: { fill: '#33494c', ink: '#33494c', tint: '#e4e8e7' },
};

export const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ label, value }));
