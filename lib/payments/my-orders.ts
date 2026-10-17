/** The account's orders and invoices (/fiokom/szamlaim, the overview's "Fizetés folytatása"). */
import type { Payload, TypedUser } from 'payload';

import { relId } from '@/payload/rel';
import type { Invoice } from '@/payload-types';

import { lapsed } from './service';

export type MyInvoice = { id: number; number: string; kind: Invoice['kind']; pdf: boolean };

export type MyOrder = {
  id: number;
  label: string;
  amount: number;
  status: 'paid' | 'refunded' | 'partially_refunded';
  paidAt: string | null;
  invoices: MyInvoice[];
};

export type MyUnpaid = { label: string; amount: number; lapsed: boolean; href: string };

/** Paid (and refunded) orders with their invoices, newest first; and the unfinished payments. */
export async function myOrders(payload: Payload, user: TypedUser, now = new Date()) {
  const own = { user, overrideAccess: false } as const;
  const [{ docs: orders }, { docs: invoices }] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: { user: { equals: user.id } },
      sort: '-createdAt',
      depth: 1,
      limit: 100,
      ...own,
    }),
    payload.find({
      collection: 'invoices',
      where: { and: [{ user: { equals: user.id } }, { status: { equals: 'issued' } }] },
      sort: 'createdAt',
      depth: 0,
      limit: 200,
      ...own,
    }),
  ]);
  const paid: MyOrder[] = orders
    .filter((o) => o.status === 'paid' || o.status === 'refunded' || o.status === 'partially_refunded')
    .map((o) => ({
      id: o.id,
      label: o.label,
      amount: o.amountDue,
      status: o.status as MyOrder['status'],
      paidAt: o.paidAt ?? null,
      invoices: invoices
        .filter((i) => relId(i.order) === o.id && i.number)
        .map((i) => ({ id: i.id, number: i.number ?? '', kind: i.kind, pdf: i.mode !== 'off' })),
    }));
  // unpaid and still held (or lapsed, but not let go): the order page continues it
  const unpaid: MyUnpaid[] = orders
    .filter((o) => o.status === 'pending' && typeof o.application === 'object' && o.application?.status === 'held')
    .map((o) => ({
      label: o.label,
      amount: o.amountDue,
      lapsed: lapsed(o, now),
      href: `/fizetes/eredmeny?rendeles=${encodeURIComponent(o.token)}`,
    }));
  return { paid, unpaid };
}
