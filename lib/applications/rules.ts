/**
 * Sign-up rules, as pure functions (no database, no clock): the server gathers the facts and asks
 * here. Every decision about counting, capacity, windows, the workshop cutoff, cancelling and
 * moving is made here, so phase 3B (payment) changes what counts — not the callers.
 *
 * Times are real moments (UTC): "48 hours before" is 48 real hours, also across a DST change.
 */
import type { Refusal, Values } from '@/lib/messages';
import type { UiStrings } from '@/payload/ui-catalogue';

import type { ApplicationKind, ApplicationStatus, WorkshopStatus } from './labels';

/** A no: a text of Felületi szövegek → Üzenetek → Jelentkezési szabályok (lib/messages.ts). */
export type RuleResult = { ok: true } | Refusal<keyof UiStrings['signupRules']>;
const refuse = (refusal: keyof UiStrings['signupRules'], values?: Values): RuleResult => ({
  ok: false,
  refusal,
  values,
});
const OK: RuleResult = { ok: true };

const HOUR = 3_600_000;

// ── what counts ─────────────────────────────────────────────────────────────

/** Statuses that hold the person's one application for a date or course (the database guard uses them too). */
export const ACTIVE_STATUSES = [
  'held',
  'registered',
  'new',
  'interview',
  'accepted',
] as const satisfies ApplicationStatus[];
/**
 * Statuses that take a place: paid (or paid offline), and awaiting payment while the hold lasts
 * (`holdUntil`; a hold that ran out simply stops counting — nothing changes its status).
 */
export const PLACE_STATUSES = ['held', 'registered'] as const satisfies ApplicationStatus[];
/** Statuses that count toward a workshop's minimum: paid only. */
export const COUNTED_STATUSES = ['registered'] as const satisfies ApplicationStatus[];

export const isActive = (status: ApplicationStatus) => (ACTIVE_STATUSES as readonly string[]).includes(status);
export const isCounted = (status: ApplicationStatus) => (COUNTED_STATUSES as readonly string[]).includes(status);

/** Does this application take a place now? */
export const takesPlace = (status: ApplicationStatus, holdUntil: Date | null | undefined, now: Date) =>
  status === 'registered' || (status === 'held' && Boolean(holdUntil) && (holdUntil as Date) > now);

/** Places left (null: no limit). Never negative. */
export function placesLeft(max: number | null | undefined, taken: number): number | null {
  return max == null ? null : Math.max(0, max - taken);
}

// ── workshops ───────────────────────────────────────────────────────────────

export type ApplicationRules = {
  /** The decision whether a workshop runs, this many hours before it starts. */
  workshopCutoffHours: number;
  /** Participants may cancel until this many hours before the start. */
  userCancelHours: number;
};
export const DEFAULT_RULES: ApplicationRules = { workshopCutoffHours: 48, userCancelHours: 24 };

export type WorkshopFacts = {
  start: Date;
  /** The session itself (a cancelled session can't be booked whatever the workshop status). */
  cancelled: boolean;
  workshopStatus: WorkshopStatus;
  bookable: boolean;
  minParticipants: number;
  maxParticipants: number | null;
  /** Places taken (PLACE_STATUSES: paid, and awaiting payment within the hold). */
  taken: number;
  /** Paid sign-ups (COUNTED_STATUSES): what the minimum is checked against. */
  paid: number;
};

export const cutoffAt = (start: Date, hours: number) => new Date(start.getTime() - hours * HOUR);

/** What the public page shows for a date. */
export type WorkshopState =
  | { state: 'open'; needed: number; left: number | null }
  | { state: 'confirmed'; left: number | null }
  | { state: 'full' }
  | { state: 'cancelled' }
  | { state: 'closed' };

export function workshopState(w: WorkshopFacts, now: Date, r: ApplicationRules): WorkshopState {
  if (w.cancelled || w.workshopStatus === 'cancelled') return { state: 'cancelled' };
  if (!w.bookable || w.start <= now) return { state: 'closed' };
  const left = placesLeft(w.maxParticipants, w.taken);
  if (left === 0) return { state: 'full' };
  if (w.workshopStatus === 'confirmed') return { state: 'confirmed', left };
  // past the cutoff and not decided yet (the job runs every few minutes): not open any more
  if (now >= cutoffAt(w.start, r.workshopCutoffHours)) return { state: 'closed' };
  const needed = Math.max(0, w.minParticipants - w.paid);
  return needed === 0 ? { state: 'confirmed', left } : { state: 'open', needed, left };
}

/** Can someone sign up for this date now? */
export function canSignUpWorkshop(w: WorkshopFacts, now: Date, r: ApplicationRules): RuleResult {
  const s = workshopState(w, now, r);
  if (s.state === 'cancelled') return refuse('sessionCancelled');
  if (s.state === 'full') return refuse('sessionFull');
  if (s.state === 'closed') return refuse('sessionClosed');
  return OK;
}

/** Is it time to decide whether the date runs? */
export function isCutoffDue(w: WorkshopFacts, now: Date, r: ApplicationRules): boolean {
  return !w.cancelled && w.workshopStatus === 'open' && now >= cutoffAt(w.start, r.workshopCutoffHours);
}

/** The decision at the cutoff. */
export const cutoffOutcome = (paid: number, minParticipants: number): 'confirmed' | 'cancelled' =>
  paid >= minParticipants ? 'confirmed' : 'cancelled';

/** May the participant cancel now? (Until `userCancelHours` before the start.) */
export function canCancel(start: Date, now: Date, r: ApplicationRules): RuleResult {
  if (now.getTime() <= start.getTime() - r.userCancelHours * HOUR) return OK;
  return refuse('cancelDeadline', { hours: r.userCancelHours });
}

/**
 * May the participant move from one date to another? From a date that was cancelled (their
 * application cancelled with it, or still registered), or one they may still cancel; to a date
 * open for sign-up.
 */
export function canMove(
  from: { status: ApplicationStatus; workshop: WorkshopFacts; sessionId: number },
  to: { workshop: WorkshopFacts; sessionId: number },
  now: Date,
  r: ApplicationRules,
): RuleResult {
  if (from.sessionId === to.sessionId) return refuse('sameSession');
  const dateCancelled = from.workshop.cancelled || from.workshop.workshopStatus === 'cancelled';
  if (dateCancelled) {
    if (from.status !== 'registered' && from.status !== 'cancelled') return refuse('notMovable');
  } else {
    if (from.status !== 'registered') return refuse('notMovable');
    const cancel = canCancel(from.workshop.start, now, r);
    if (!cancel.ok) return refuse('moveDeadline', { hours: r.userCancelHours });
  }
  return canSignUpWorkshop(to.workshop, now, r);
}

// ── courses ─────────────────────────────────────────────────────────────────

export type CourseFacts = {
  kind: Exclude<ApplicationKind, 'workshop'>;
  enabled: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
  /** Beginner courses only; null: no limit. */
  capacity: number | null;
  /** Active applications (ACTIVE_STATUSES) — a professional application holds no place. */
  taken: number;
};

export type CourseSignupState =
  | { state: 'open'; left: number | null }
  | { state: 'full' }
  | { state: 'notYet'; opensAt: Date }
  | { state: 'closed' };

export function courseSignupState(c: CourseFacts, now: Date): CourseSignupState {
  if (!c.enabled) return { state: 'closed' };
  if (c.opensAt && now < c.opensAt) return { state: 'notYet', opensAt: c.opensAt };
  if (c.closesAt && now >= c.closesAt) return { state: 'closed' };
  if (c.kind === 'professional') return { state: 'open', left: null };
  const left = placesLeft(c.capacity, c.taken);
  return left === 0 ? { state: 'full' } : { state: 'open', left };
}

export function canSignUpCourse(c: CourseFacts, now: Date): RuleResult {
  const s = courseSignupState(c, now);
  if (s.state === 'full') return refuse('courseFull');
  if (s.state === 'notYet') return refuse('courseNotYet');
  if (s.state === 'closed') return refuse('courseClosed');
  return OK;
}

/**
 * May one apply to the course without a group? Its "Jelentkezés csoport nélkül is" is on and it takes
 * this kind (the page: whether to offer it; the server: whether to accept it).
 */
export const canApplyWithoutGroup = (
  c: { openWithoutGroup?: boolean | null; signupMode?: string | null },
  kind: 'beginner' | 'professional',
): boolean => Boolean(c.openWithoutGroup) && c.signupMode === kind;

/** A beginner sign-up may be cancelled until the course starts. */
export function canCancelCourse(courseStart: Date, now: Date): RuleResult {
  return now < courseStart ? OK : refuse('courseStarted');
}

/** A professional application may be withdrawn while it is being reviewed. */
export function canWithdraw(status: ApplicationStatus): RuleResult {
  return status === 'new' || status === 'interview' ? OK : refuse('notWithdrawable');
}

/** A professional application's motivation: required, at least this long (after trimming). */
export const MIN_MOTIVATION = 100;

/**
 * Whether the form asks for a phone number: for applications (Nyitott Műhely, kezdő, szakmai) yes;
 * show tickets, free or paid, go without one (as registration and Google sign-up do). The forms
 * mark the field by this and the server checks it.
 */
export const needsPhone = (kind: ApplicationKind) => kind !== 'show';

// ── shows booked on the site ────────────────────────────────────────────────

export type ShowFacts = {
  start: Date;
  /** "Foglalható" on, the show not hidden. */
  open: boolean;
  seats: number;
  /** Seats taken (PLACE_STATUSES: booked, or awaiting payment within the hold). */
  taken: number;
};

export type ShowState = { state: 'open'; left: number } | { state: 'full' } | { state: 'closed' };

export function showState(s: ShowFacts, now: Date): ShowState {
  if (!s.open || s.start <= now) return { state: 'closed' };
  const left = placesLeft(s.seats, s.taken) ?? 0;
  return left === 0 ? { state: 'full' } : { state: 'open', left };
}

/** May someone book this many seats now (at most `maxPerBooking`, and what is left)? */
export function canBookShow(s: ShowFacts, seats: number, maxPerBooking: number, now: Date): RuleResult {
  const state = showState(s, now);
  if (state.state === 'closed') return refuse('showClosed');
  if (state.state === 'full') return refuse('showFull');
  if (!Number.isInteger(seats) || seats < 1 || seats > maxPerBooking)
    return refuse('seatsRange', { max: maxPerBooking });
  if (seats > state.left) return refuse('seatsLeft', { count: state.left });
  return OK;
}

/** A free booking may be cancelled until the show starts; a paid ticket only by staff (a refund). */
export const canCancelShow = (start: Date, paid: boolean, now: Date): RuleResult =>
  paid ? refuse('ticketNoCancel') : now < start ? OK : refuse('showStarted');
