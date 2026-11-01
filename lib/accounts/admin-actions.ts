'use server';

/** "Fiók összevonása" on an account (admin → Felhasználók). Admins only: it deletes an account. */
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { userIsAdmin } from '@/payload/access';

import { type MergePreview, mergePreview, mergeUsers } from './merge';

const denied = { ok: false as const, reason: 'Ehhez adminisztrátori jogosultság kell.' };

export async function mergePreviewAction(
  keepId: number,
  otherEmail: string,
): Promise<{ ok: true; preview: MergePreview } | { ok: false; reason: string }> {
  if (!userIsAdmin(await getCurrentUser())) return denied;
  const preview = await mergePreview(await payloadClient(), keepId, otherEmail);
  return preview ? { ok: true, preview } : { ok: false, reason: 'Nincs fiók ezzel az e-mail-címmel.' };
}

export async function mergeUsersAction(keepId: number, dropId: number, emailFrom: 'keep' | 'drop') {
  if (!userIsAdmin(await getCurrentUser())) return denied;
  return mergeUsers(await payloadClient(), keepId, dropId, emailFrom);
}
