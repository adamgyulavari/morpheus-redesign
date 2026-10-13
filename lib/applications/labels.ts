/** Names of application kinds and statuses — the admin, the student area and the e-mails share them. */

export const APPLICATION_KINDS = {
  workshop: 'Nyitott Műhely',
  beginner: 'Kezdő kurzus',
  professional: 'Szakmai kurzus',
} as const;
export type ApplicationKind = keyof typeof APPLICATION_KINDS;

/** Workshop and beginner sign-ups. */
export const SIGNUP_STATUSES = {
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

/** Course group type → the sign-up kind it takes. */
export const SIGNUP_KIND_OF_TYPE: Record<string, 'beginner' | 'professional' | undefined> = {
  kezdo: 'beginner',
  szakmai: 'professional',
};
