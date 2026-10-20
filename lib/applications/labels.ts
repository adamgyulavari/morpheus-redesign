/** Names of application kinds and statuses — the admin, the student area and the e-mails share them. */

export const APPLICATION_KINDS = {
  workshop: 'Nyitott Műhely',
  beginner: 'Kezdő kurzus',
  professional: 'Szakmai kurzus',
  show: 'Előadás',
} as const;
export type ApplicationKind = keyof typeof APPLICATION_KINDS;

/** Workshop and beginner sign-ups. */
export const SIGNUP_STATUSES = {
  held: 'Fizetésre vár',
  registered: 'Jelentkezett',
  cancelled: 'Lemondva',
  moved: 'Áthelyezve',
} as const;

/** Professional applications. */
export const REVIEW_STATUSES = {
  new: 'Új',
  interview: 'Interjú',
  accepted: 'Felvéve',
  rejected: 'Elutasítva',
  withdrawn: 'Visszavonta',
} as const;

export const APPLICATION_STATUSES = { ...SIGNUP_STATUSES, ...REVIEW_STATUSES };
export type ApplicationStatus = keyof typeof APPLICATION_STATUSES;

export const WORKSHOP_STATUSES = {
  open: 'Gyűjti a jelentkezőket',
  confirmed: 'Biztosan indul',
  cancelled: 'Elmarad',
} as const;
export type WorkshopStatus = keyof typeof WORKSHOP_STATUSES;

/** A course group's sign-up on the website. */
export const SIGNUP_MODES = {
  closed: 'Zárva',
  open: 'Nyitva (a kurzus kezdéséig)',
  window: 'Időablakban',
} as const;
export type SignupMode = keyof typeof SIGNUP_MODES;

/** A course group's type. */
export const GROUP_TYPES = { kezdo: 'Kezdő', szakmai: 'Szakmai', tarsulat: 'Társulat', egyeb: 'Egyéb' } as const;

/** Course group type → the sign-up kind it takes. */
export const SIGNUP_KIND_OF_TYPE: Record<string, 'beginner' | 'professional' | undefined> = {
  kezdo: 'beginner',
  szakmai: 'professional',
};
