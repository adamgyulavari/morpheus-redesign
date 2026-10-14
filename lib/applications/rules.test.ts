import { describe, expect, it } from 'vitest';

import { at, clockOf, dayOf } from '@/lib/rooms/time';

import {
  type ApplicationRules,
  type CourseFacts,
  canApplyWithoutGroup,
  canCancel,
  canCancelCourse,
  canMove,
  canSignUpCourse,
  canSignUpWorkshop,
  canWithdraw,
  courseSignupState,
  cutoffAt,
  cutoffOutcome,
  DEFAULT_RULES,
  isCounted,
  isCutoffDue,
  placesLeft,
  takesPlace,
  type WorkshopFacts,
  workshopState,
} from './rules';

const rules: ApplicationRules = DEFAULT_RULES; // 48 h cutoff, 24 h cancel
const start = at('2026-11-21', '10:00'); // a Saturday
const workshop = (extra: Partial<WorkshopFacts> = {}): WorkshopFacts => ({
  start,
  cancelled: false,
  workshopStatus: 'open',
  bookable: true,
  minParticipants: 5,
  maxParticipants: 12,
  taken: 3,
  paid: 3,
  ...extra,
});
const hoursBefore = (h: number, from = start) => new Date(from.getTime() - h * 3_600_000);
const reason = (r: { ok: boolean; reason?: string }) => (r.ok ? 'ok' : r.reason);

describe('counting', () => {
  it('only paid (registered) sign-ups count toward the minimum', () => {
    expect(isCounted('registered')).toBe(true);
    for (const s of ['held', 'cancelled', 'moved', 'credited', 'refunded', 'new', 'interview', 'accepted'] as const)
      expect(isCounted(s)).toBe(false);
  });

  it('a place is taken when paid, or while the hold lasts', () => {
    const now = new Date('2026-11-01T10:00:00Z');
    expect(takesPlace('registered', null, now)).toBe(true);
    expect(takesPlace('held', new Date('2026-11-01T10:20:00Z'), now)).toBe(true);
    expect(takesPlace('held', new Date('2026-11-01T09:59:00Z'), now)).toBe(false);
    expect(takesPlace('held', null, now)).toBe(false);
    expect(takesPlace('cancelled', null, now)).toBe(false);
  });

  it('places left never go below zero; no maximum means no limit', () => {
    expect(placesLeft(12, 3)).toBe(9);
    expect(placesLeft(12, 14)).toBe(0);
    expect(placesLeft(null, 100)).toBeNull();
  });
});

describe('workshop state (the public page)', () => {
  const now = hoursBefore(100);

  it('needs more people before the minimum', () => {
    expect(workshopState(workshop(), now, rules)).toEqual({ state: 'open', needed: 2, left: 9 });
  });

  it('reaching the minimum reads as running, before the cutoff decides', () => {
    expect(workshopState(workshop({ taken: 5, paid: 5 }), now, rules)).toEqual({ state: 'confirmed', left: 7 });
  });

  it('places awaiting payment are taken, but only paid ones count toward the minimum', () => {
    expect(workshopState(workshop({ taken: 5, paid: 3 }), now, rules)).toEqual({ state: 'open', needed: 2, left: 7 });
  });

  it('full, cancelled, closed', () => {
    expect(workshopState(workshop({ taken: 12 }), now, rules)).toEqual({ state: 'full' });
    expect(workshopState(workshop({ workshopStatus: 'cancelled' }), now, rules)).toEqual({ state: 'cancelled' });
    expect(workshopState(workshop({ cancelled: true }), now, rules)).toEqual({ state: 'cancelled' });
    expect(workshopState(workshop({ bookable: false }), now, rules)).toEqual({ state: 'closed' });
    expect(workshopState(workshop(), start, rules)).toEqual({ state: 'closed' });
  });
});

describe('signing up for a workshop', () => {
  it('is open until the cutoff', () => {
    expect(canSignUpWorkshop(workshop(), hoursBefore(48.1), rules).ok).toBe(true);
    expect(reason(canSignUpWorkshop(workshop(), hoursBefore(47.9), rules))).toBe(
      'Erre az alkalomra már nem lehet jelentkezni.',
    );
  });

  it('after the cutoff only on a confirmed date with places left', () => {
    expect(canSignUpWorkshop(workshop({ workshopStatus: 'confirmed', taken: 6 }), hoursBefore(10), rules).ok).toBe(
      true,
    );
    expect(
      reason(canSignUpWorkshop(workshop({ workshopStatus: 'confirmed', taken: 12 }), hoursBefore(10), rules)),
    ).toBe('Ez az alkalom megtelt.');
    expect(reason(canSignUpWorkshop(workshop({ workshopStatus: 'cancelled' }), hoursBefore(10), rules))).toBe(
      'Ez az alkalom elmarad, erre már nem lehet jelentkezni.',
    );
  });

  it('not once it has started', () => {
    expect(canSignUpWorkshop(workshop({ workshopStatus: 'confirmed' }), hoursBefore(-0.1), rules).ok).toBe(false);
  });
});

describe('the cutoff', () => {
  it('is due 48 hours before, once', () => {
    expect(isCutoffDue(workshop(), hoursBefore(48.01), rules)).toBe(false);
    expect(isCutoffDue(workshop(), hoursBefore(48), rules)).toBe(true);
    expect(isCutoffDue(workshop({ workshopStatus: 'confirmed' }), hoursBefore(1), rules)).toBe(false);
    expect(isCutoffDue(workshop({ cancelled: true }), hoursBefore(1), rules)).toBe(false);
  });

  it('runs with the minimum, else it is cancelled', () => {
    expect(cutoffOutcome(4, 5)).toBe('cancelled');
    expect(cutoffOutcome(5, 5)).toBe('confirmed');
    expect(cutoffOutcome(9, 5)).toBe('confirmed');
  });

  it('counts real hours across the autumn DST change', () => {
    // Mon 26 Oct 2026 10:00 CET; clocks went back on Sunday 25 Oct (03:00 CEST → 02:00 CET)
    const monday = at('2026-10-26', '10:00');
    const cut = cutoffAt(monday, 48);
    expect(monday.getTime() - cut.getTime()).toBe(48 * 3_600_000);
    // so on the wall clock it is Saturday 11:00 (summer time), not 10:00
    expect([dayOf(cut), clockOf(cut)]).toEqual(['2026-10-24', '11:00']);
  });

  it('and across the spring change', () => {
    // Sun 29 Mar 2026 10:00 CEST; clocks went forward that night (02:00 CET → 03:00 CEST)
    const sunday = at('2026-03-29', '10:00');
    const cancelBy = new Date(sunday.getTime() - 24 * 3_600_000);
    expect([dayOf(cancelBy), clockOf(cancelBy)]).toEqual(['2026-03-28', '09:00']);
    expect(canCancel(sunday, at('2026-03-28', '09:00'), rules).ok).toBe(true);
    expect(canCancel(sunday, at('2026-03-28', '09:30'), rules).ok).toBe(false);
  });
});

describe('cancelling', () => {
  it('works at 25 hours, not at 23', () => {
    expect(canCancel(start, hoursBefore(25), rules).ok).toBe(true);
    expect(canCancel(start, hoursBefore(24), rules).ok).toBe(true);
    expect(reason(canCancel(start, hoursBefore(23), rules))).toBe(
      'Lemondani legkésőbb 24 órával a kezdés előtt lehet.',
    );
  });
});

describe('moving', () => {
  const later = { sessionId: 2, workshop: workshop({ start: at('2026-11-28', '10:00') }) };
  const now = hoursBefore(30);

  it('from a cancelled date, also after the cancellation deadline', () => {
    const from = { sessionId: 1, status: 'cancelled' as const, workshop: workshop({ workshopStatus: 'cancelled' }) };
    expect(canMove(from, later, hoursBefore(10), rules).ok).toBe(true);
  });

  it('from a running date only until the cancellation deadline', () => {
    const from = { sessionId: 1, status: 'registered' as const, workshop: workshop() };
    expect(canMove(from, later, now, rules).ok).toBe(true);
    expect(reason(canMove(from, later, hoursBefore(23), rules))).toContain('Áthelyezni csak a lemondási határidőig');
  });

  it('not to the same date, a full one, or an already moved application', () => {
    const from = { sessionId: 1, status: 'registered' as const, workshop: workshop() };
    expect(reason(canMove(from, { ...later, sessionId: 1 }, now, rules))).toBe(
      'Ugyanarra az alkalomra nem lehet áthelyezni.',
    );
    expect(reason(canMove(from, { ...later, workshop: { ...later.workshop, taken: 12 } }, now, rules))).toBe(
      'Ez az alkalom megtelt.',
    );
    expect(canMove({ ...from, status: 'moved' }, later, now, rules).ok).toBe(false);
  });
});

describe('course sign-up', () => {
  const course = (extra: Partial<CourseFacts> = {}): CourseFacts => ({
    kind: 'beginner',
    enabled: true,
    opensAt: at('2026-11-01', '00:00'),
    closesAt: at('2026-12-01', '00:00'),
    capacity: 14,
    taken: 10,
    ...extra,
  });
  const now = at('2026-11-15', '12:00');

  it('within the window, with places left', () => {
    expect(courseSignupState(course(), now)).toEqual({ state: 'open', left: 4 });
    expect(canSignUpCourse(course(), now).ok).toBe(true);
  });

  it('not yet open, closed, disabled', () => {
    expect(courseSignupState(course(), at('2026-10-31', '23:00')).state).toBe('notYet');
    expect(courseSignupState(course(), at('2026-12-01', '00:00')).state).toBe('closed');
    expect(reason(canSignUpCourse(course({ enabled: false }), now))).toBe(
      'Erre a kurzusra most nem lehet jelentkezni.',
    );
  });

  it('capacity only for beginner courses', () => {
    expect(reason(canSignUpCourse(course({ taken: 14 }), now))).toBe('Ez a kurzus megtelt.');
    expect(canSignUpCourse(course({ kind: 'professional', taken: 99 }), now).ok).toBe(true);
  });
});

describe('cancelling a course sign-up, withdrawing an application', () => {
  it('a beginner sign-up until the course starts', () => {
    const first = at('2026-11-05', '18:00');
    expect(canCancelCourse(first, at('2026-11-05', '17:59')).ok).toBe(true);
    expect(canCancelCourse(first, first).ok).toBe(false);
  });

  it('a professional application while it is being reviewed', () => {
    expect(canWithdraw('new').ok).toBe(true);
    expect(canWithdraw('interview').ok).toBe(true);
    expect(canWithdraw('accepted').ok).toBe(false);
    expect(canWithdraw('rejected').ok).toBe(false);
  });
});

describe('canApplyWithoutGroup', () => {
  it('only with the switch on, for the kind the course takes', () => {
    expect(canApplyWithoutGroup({ openWithoutGroup: true, signupMode: 'beginner' }, 'beginner')).toBe(true);
    expect(canApplyWithoutGroup({ openWithoutGroup: false, signupMode: 'beginner' }, 'beginner')).toBe(false);
    expect(canApplyWithoutGroup({ openWithoutGroup: true, signupMode: 'beginner' }, 'professional')).toBe(false);
    expect(canApplyWithoutGroup({ openWithoutGroup: true, signupMode: 'external' }, 'beginner')).toBe(false);
  });
});
