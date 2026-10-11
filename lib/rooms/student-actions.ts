'use server';

/**
 * The student area's room calendar (/fiokom/terem): the schedule, booking and cancelling practice.
 * Only for logged-in active students (and staff); every write is re-checked against the rules.
 */
import { getCurrentUser, payloadClient } from '@/lib/auth';

import type { RuleResult } from './rules';
import { bookPractice, cancelPractice, getRoomSchedule, type PracticeInput, type ScheduleEvent } from './server';

export async function loadSchedule(
  roomIds: number[] | null,
  from: string,
  to: string,
): Promise<ScheduleEvent[] | null> {
  const user = await getCurrentUser();
  return getRoomSchedule(await payloadClient(), user, roomIds, new Date(from), new Date(to));
}

export async function bookPracticeAction(input: PracticeInput): Promise<RuleResult & { bookingId?: number }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'Jelentkezz be újra.' };
  return bookPractice(await payloadClient(), user, input);
}

export async function cancelPracticeAction(bookingId: number): Promise<RuleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'Jelentkezz be újra.' };
  return cancelPractice(await payloadClient(), user, bookingId);
}
