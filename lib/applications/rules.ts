/**
 * Sign-up rules, as pure functions (no database, no clock): the server gathers the facts and asks
 * here. Every decision about counting, capacity, windows, the workshop cutoff, cancelling and
 * moving is made here, so phase 3B (payment) changes what counts — not the callers.
 *
 * Times are real moments (UTC): "48 hours before" is 48 real hours, also across a DST change.
 */
import type { ApplicationKind, ApplicationStatus, WorkshopStatus } from './labels';

export type RuleResult = { ok: true } | { ok: false; reason: string };
const refuse = (reason: string): RuleResult => ({ ok: false, reason });
const OK: RuleResult = { ok: true };

const HOUR = 3_600_000;

// ── what counts ─────────────────────────────────────────────────────────────

/** Statuses that hold the person's one application for a date or course (the database guard uses them too). */
export const ACTIVE_STATUSES = ['registered', 'new', 'interview', 'accepted'] as const satisfies ApplicationStatus[];
/** Statuses that take a place and count toward a workshop's minimum. 3B: registered and paid. */
export const COUNTED_STATUSES = ['registered'] as const satisfies ApplicationStatus[];

export const isActive = (status: ApplicationStatus) => (ACTIVE_STATUSES as readonly string[]).includes(status);
export const isCounted = (status: ApplicationStatus) => (COUNTED_STATUSES as readonly string[]).includes(status);

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
  /** Counted sign-ups (COUNTED_STATUSES). */
  taken: number;
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
  const needed = Math.max(0, w.minParticipants - w.taken);
  return needed === 0 ? { state: 'confirmed', left } : { state: 'open', needed, left };
}

/** Can someone sign up for this date now? */
export function canSignUpWorkshop(w: WorkshopFacts, now: Date, r: ApplicationRules): RuleResult {
  const s = workshopState(w, now, r);
  if (s.state === 'cancelled') return refuse('Ez az alkalom elmarad, erre már nem lehet jelentkezni.');
  if (s.state === 'full') return refuse('Ez az alkalom megtelt.');
  if (s.state === 'closed') return refuse('Erre az alkalomra már nem lehet jelentkezni.');
  return OK;
}

/** Is it time to decide whether the date runs? */
export function isCutoffDue(w: WorkshopFacts, now: Date, r: ApplicationRules): boolean {
  return !w.cancelled && w.workshopStatus === 'open' && now >= cutoffAt(w.start, r.workshopCutoffHours);
}

/** The decision at the cutoff. */
export const cutoffOutcome = (taken: number, minParticipants: number): 'confirmed' | 'cancelled' =>
  taken >= minParticipants ? 'confirmed' : 'cancelled';

/** May the participant cancel now? (Until `userCancelHours` before the start.) */
export function canCancel(start: Date, now: Date, r: ApplicationRules): RuleResult {
  if (now.getTime() <= start.getTime() - r.userCancelHours * HOUR) return OK;
  return refuse(`Lemondani legkésőbb ${r.userCancelHours} órával a kezdés előtt lehet.`);
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
  if (from.sessionId === to.sessionId) return refuse('Ugyanarra az alkalomra nem lehet áthelyezni.');
  const dateCancelled = from.workshop.cancelled || from.workshop.workshopStatus === 'cancelled';
  if (dateCancelled) {
    if (from.status !== 'registered' && from.status !== 'cancelled')
      return refuse('Ezt a jelentkezést már nem lehet áthelyezni.');
  } else {
    if (from.status !== 'registered') return refuse('Ezt a jelentkezést már nem lehet áthelyezni.');
    const cancel = canCancel(from.workshop.start, now, r);
    if (!cancel.ok) return refuse(`Áthelyezni csak a lemondási határidőig lehet (${r.userCancelHours} órával előtte).`);
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
  if (s.state === 'full') return refuse('Ez a kurzus megtelt.');
  if (s.state === 'notYet') return refuse('Erre a kurzusra még nem nyílt meg a jelentkezés.');
  if (s.state === 'closed') return refuse('Erre a kurzusra most nem lehet jelentkezni.');
  return OK;
}

/** A professional application's motivation: required, at least this long (after trimming). */
export const MIN_MOTIVATION = 100;
