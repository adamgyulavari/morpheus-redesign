/**
 * The order's building blocks the checkout, the provider's answers and the order page share: its
 * row lock, paid / let go, when it lapsed, finding it by its token, the follow-up job.
 * Amounts are whole forints. Times UTC.
 */
import { sql } from '@payloadcms/db-postgres';
import type { Payload, PayloadRequest } from 'payload';

import { dbOf } from '@/payload/db';
import { siteUrl } from '@/payload/email';
import { relId } from '@/payload/rel';
import type { Order } from '@/payload-types';

export type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: string };

/** The order page's address: by the order's token, never its id. */
export const resultUrl = (token: string) => siteUrl(`/fizetes/eredmeny?rendeles=${encodeURIComponent(token)}`);

/** The order, locked for the rest of the transaction (one change at a time). */
export async function lockOrder(req: PayloadRequest, id: number): Promise<Order> {
  const db = await dbOf(req.payload, req);
  await db.execute(sql`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`);
  return req.payload.findByID({ collection: 'orders', id, depth: 0, req });
}

/** Order paid, application registered (its hold ends). Inside the order's lock. */
export async function confirmOrder(req: PayloadRequest, order: Order) {
  const applicationId = relId(order.application);
  if (applicationId)
    await req.payload.update({
      collection: 'applications',
      id: applicationId,
      data: { status: 'registered', holdUntil: null, cancelReason: null, cancelledAt: null },
      req,
    });
  await req.payload.update({
    collection: 'orders',
    id: order.id,
    data: { status: 'paid', paidAt: new Date().toISOString() },
    req,
  });
}

/** The order's held application lets its place go. */
export async function releaseHold(req: PayloadRequest, order: Order, reason: string) {
  const id = relId(order.application);
  if (!id) return;
  const a = await req.payload.findByID({ collection: 'applications', id, depth: 0, req });
  if (a.status === 'held')
    await req.payload.update({
      collection: 'applications',
      id,
      data: { status: 'cancelled', cancelReason: reason, holdUntil: null },
      req,
    });
}

/** An unpaid order whose hold ran out (by its date — nothing marks it). */
export const lapsed = (order: Pick<Order, 'status' | 'expiresAt'>, now: Date) =>
  order.status === 'pending' && Boolean(order.expiresAt) && new Date(order.expiresAt as string) <= now;

export async function orderByToken(payload: Payload, token: string): Promise<Order | null> {
  if (!token || token.length < 20) return null;
  const { docs } = await payload.find({
    collection: 'orders',
    where: { token: { equals: token } },
    depth: 0,
    limit: 1,
  });
  return docs[0] ?? null;
}

export const FOLLOW_UP_QUEUE = 'payments';

/** After paying: the `orderPaid` job (after-paid.ts). */
export async function queueFollowUps(payload: Payload, orderId: number) {
  await payload.jobs.queue({ task: 'orderPaid', input: { orderId }, queue: FOLLOW_UP_QUEUE });
}
