'use server';

/**
 * The student area's room calendar (/fiokom/terem): the schedule, booking and cancelling practice.
 * Only for logged-in active students (and staff); every write is re-checked against the rules.
 */
import { getCurrentUser, payloadClient } from '@/lib/auth';

import type { Result } from '@/lib/messages';
import { uiTexts } from '@/payload/ui-texts';

import { bookPractice, cancelPractice, getRoomSchedule, type PracticeInput, type ScheduleEvent } from './server';

export async function loadSchedule(from: string, to: string): Promise<ScheduleEvent[] | null> {
  const user = await getCurrentUser();
  return getRoomSchedule(await payloadClient(), user, new Date(from), new Date(to));
}

export async function bookPracticeAction(input: PracticeInput): Promise<Result<{ bookingId?: number }>> {
  const [user, payload] = await Promise.all([getCurrentUser(), payloadClient()]);
  if (!user) return { ok: false, reason: (await uiTexts(payload)).accountErrors.loginAgain };
  return bookPractice(payload, user, input);
}

export async function cancelPracticeAction(bookingId: number): Promise<Result> {
  const [user, payload] = await Promise.all([getCurrentUser(), payloadClient()]);
  if (!user) return { ok: false, reason: (await uiTexts(payload)).accountErrors.loginAgain };
  return cancelPractice(payload, user, bookingId);
}
