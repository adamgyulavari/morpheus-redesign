/** Names and colours of session and booking kinds — the admin, the calendars and the e-mails share them. */

export const SESSION_KINDS = {
  course: 'Óra',
  rehearsal: 'Próba',
  exam: 'Vizsga',
  show: 'Előadás',
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

/** Calendar colours by what is happening (site palette). */
export const KIND_COLORS: Record<SessionKind | Exclude<BookingKind, 'session'>, string> = {
  course: '#0f5f63',
  rehearsal: '#6b4c9a',
  exam: '#b8472a',
  show: '#c24e2c',
  other: '#4d6366',
  practice: '#d9a441',
  rental: '#33494c',
};

export const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ label, value }));
