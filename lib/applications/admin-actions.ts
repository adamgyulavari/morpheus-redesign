'use server';

/**
 * The admin's application actions (the participant panel on a workshop session, the buttons on an
 * application). Staff only.
 */
import type { TypedUser } from 'payload';

import { getCurrentUser, payloadClient } from '@/lib/auth';
import { userIsStaffOrAdmin } from '@/payload/access';

import {
  type ApplicantInput,
  addParticipant,
  type Decision,
  dashboard,
  decide,
  messageParticipants,
  participants,
} from './server';

type Result = { ok: true; message?: string } | { ok: false; reason: string };
const denied = { ok: false as const, reason: 'Ehhez munkatársi jogosultság kell.' };

async function staff(): Promise<TypedUser | null> {
  const user = await getCurrentUser();
  return user && userIsStaffOrAdmin(user) ? user : null;
}
const done = (r: { ok: boolean; reason?: string }, message?: string): Result => {
  if (!r.ok) return { ok: false, reason: r.reason ?? 'Hiba történt.' };
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

export async function messageParticipantsAction(sessionId: number, subject: string, message: string): Promise<Result> {
  if (!(await staff())) return denied;
  const r = await messageParticipants(await payloadClient(), sessionId, subject, message);
  return r.ok ? { ok: true, message: `Elküldve ${r.sent} résztvevőnek.` } : r;
}

export async function dashboardData() {
  if (!(await staff())) return null;
  return dashboard(await payloadClient());
}

/** The dashboard dialog's one button: payment fields, then the decision (lib/applications/server decide). */
export async function decideAction(
  id: number,
  input: { decision: Decision; paid?: boolean; paymentNote?: string; groupId?: number | null },
): Promise<Result> {
  const user = await staff();
  if (!user) return denied;
  const r = await decide(await payloadClient(), user, id, input);
  return r.ok ? { ok: true, message: r.message } : r;
}
