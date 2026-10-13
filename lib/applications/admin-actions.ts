'use server';

/**
 * The admin's application actions (the participant panel on a workshop session, the buttons on an
 * application). Staff only.
 */
import { revalidatePath } from 'next/cache';
import type { TypedUser } from 'payload';

import { getCurrentUser, payloadClient } from '@/lib/auth';
import { userIsStaffOrAdmin } from '@/payload/access';

import {
  type ApplicantInput,
  addParticipant,
  admit,
  cancelByStaff,
  messageParticipants,
  participants,
  review,
  setPaid,
} from './server';

type Result = { ok: true; message?: string } | { ok: false; reason: string };
const denied = { ok: false as const, reason: 'Ehhez munkatársi jogosultság kell.' };

async function staff(): Promise<TypedUser | null> {
  const user = await getCurrentUser();
  return user && userIsStaffOrAdmin(user) ? user : null;
}
const done = (r: { ok: boolean; reason?: string }, message?: string): Result => {
  if (!r.ok) return { ok: false, reason: r.reason ?? 'Hiba történt.' };
  revalidatePath('/', 'layout');
  return { ok: true, message };
};

export async function participantList(sessionId: number) {
  if (!(await staff())) return null;
  return participants(await payloadClient(), sessionId);
}

export async function addParticipantAction(sessionId: number, input: ApplicantInput): Promise<Result> {
  if (!(await staff())) return denied;
  return done(await addParticipant(await payloadClient(), sessionId, input), 'Hozzáadva.');
}

export async function cancelParticipantAction(id: number): Promise<Result> {
  if (!(await staff())) return denied;
  return done(await cancelByStaff(await payloadClient(), id), 'Lemondva.');
}

export async function setPaidAction(id: number, paid: boolean): Promise<Result> {
  if (!(await staff())) return denied;
  return done(await setPaid(await payloadClient(), id, paid));
}

export async function messageParticipantsAction(sessionId: number, subject: string, message: string): Promise<Result> {
  if (!(await staff())) return denied;
  const r = await messageParticipants(await payloadClient(), sessionId, subject, message);
  return r.ok ? { ok: true, message: `Elküldve ${r.sent} résztvevőnek.` } : r;
}

export async function admitAction(id: number, groupId?: number | null): Promise<Result> {
  const user = await staff();
  if (!user) return denied;
  return done(await admit(await payloadClient(), user, id, groupId), 'Felvéve a kurzusba; az üdvözlő levél elment.');
}

export async function reviewAction(id: number, status: 'interview' | 'rejected'): Promise<Result> {
  if (!(await staff())) return denied;
  return done(
    await review(await payloadClient(), id, status),
    status === 'interview' ? 'Interjú állapotba téve.' : 'Elutasítva (e-mail nem ment).',
  );
}
