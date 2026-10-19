'use server';

/** "Szinkronizálás a Facebookról" (staff only). */
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { errorMessage } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';

import { facebookConfigured } from './graph';
import { type SyncResult, syncFromFacebook } from './sync';

export async function syncFacebookAction(): Promise<{ ok: true; result: SyncResult } | { ok: false; reason: string }> {
  if (!userIsStaffOrAdmin(await getCurrentUser())) return { ok: false, reason: 'Ehhez munkatársi jogosultság kell.' };
  if (!facebookConfigured())
    return { ok: false, reason: 'A Facebook-kapcsolat nincs beállítva (FACEBOOK_PAGE_ID, FACEBOOK_PAGE_TOKEN).' };
  try {
    return { ok: true, result: await syncFromFacebook(await payloadClient()) };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}
