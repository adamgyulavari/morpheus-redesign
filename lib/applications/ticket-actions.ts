'use server';

/** "Jegy felhasználása" on /jegy/<code>: staff only (logged in on their phone at the door). */
import { revalidatePath } from 'next/cache';

import { getCurrentUser, payloadClient } from '@/lib/auth';
import { userIsStaffOrAdmin } from '@/payload/access';

import { redeemTicket, ticketPath } from './tickets';

export async function redeemTicketAction(code: string): Promise<'used' | 'already' | 'invalid' | 'denied'> {
  const user = await getCurrentUser();
  if (!user || !userIsStaffOrAdmin(user)) return 'denied';
  const r = await redeemTicket(await payloadClient(), code, user.id);
  revalidatePath(ticketPath(code));
  return r;
}
