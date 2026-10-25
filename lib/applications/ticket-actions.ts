'use server';

/** "Jegy felhasználása" on /jegy/<code>: staff only (logged in on their phone at the door). */
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { userIsStaffOrAdmin } from '@/payload/access';

import { redeemTicket } from './tickets';

export async function redeemTicketAction(code: string): Promise<'used' | 'already' | 'invalid' | 'denied'> {
  const user = await getCurrentUser();
  if (!user || !userIsStaffOrAdmin(user)) return 'denied';
  // no revalidatePath: the page is dynamic, and re-rendering it now would drop the button's answer
  return redeemTicket(await payloadClient(), code, user.id);
}
