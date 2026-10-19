'use server';

/** Staff's "Visszatérítés" on an order (admin → Rendelések). Admins only: it sends money back. */
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { userIsAdmin } from '@/payload/access';

import { refundOrder } from './refunds';

export async function refundOrderAction(orderId: number, amount: number | null, note: string) {
  const user = await getCurrentUser();
  if (!user || !userIsAdmin(user)) return { ok: false as const, reason: 'Ehhez adminisztrátori jogosultság kell.' };
  return refundOrder(await payloadClient(), orderId, { amount: amount ?? undefined, note }, user.id);
}
