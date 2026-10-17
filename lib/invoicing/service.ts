/**
 * Invoices for paid orders (Számlázz.hu, `./szamlazz` — the only file that knows it). One invoice
 * per order, one storno per invoice (a unique key each). `INVOICING_MODE`:
 * - `off` (default): the invoice is prepared and stored as a draft, nothing is sent;
 * - `test`: sent to a Számlázz.hu test account (test invoices, nothing reaches NAV);
 * - `live`: real invoices — refused anywhere but the live site.
 * Nothing here throws at the caller: a failure is stored on the invoice and staff are told.
 */
import type { Payload } from 'payload';

import { applicationSettings } from '@/lib/applications/settings';
import { todayInBudapest } from '@/lib/dates';
import { sendStaffAlert } from '@/lib/payments/notify';
import { billingSettings } from '@/lib/payments/settings';
import { errorMessage } from '@/lib/rooms/server';
import { relId } from '@/payload/rel';
import type { Invoice, Order, User } from '@/payload-types';

import {
  type AgentResult,
  createInvoice,
  createStorno,
  type InvoiceData,
  invoicePdf,
  split,
  type VatMode,
} from './szamlazz';

export type InvoicingMode = 'off' | 'test' | 'live';

/** The mode from env; a misconfiguration throws (and is reported, see `record`). */
export function invoicingMode(): InvoicingMode {
  const mode = process.env.INVOICING_MODE || 'off';
  if (mode === 'off') return 'off';
  if (mode !== 'test' && mode !== 'live') throw new Error(`INVOICING_MODE: unknown mode "${mode}"`);
  const host = new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost').hostname;
  if (mode === 'live' && (process.env.NODE_ENV !== 'production' || ['localhost', '127.0.0.1'].includes(host)))
    throw new Error('INVOICING_MODE=live is only allowed on the live site');
  if (!process.env.SZAMLAZZ_AGENT_KEY) throw new Error(`INVOICING_MODE=${mode} needs SZAMLAZZ_AGENT_KEY`);
  return mode;
}

/** The amount on the invoice: what was paid. */
export const invoiceAmountFor = (order: Pick<Order, 'amountDue'>) => Math.max(0, order.amountDue);

const UNIT: Record<Order['kind'], string> = { workshop: 'alkalom', beginner: 'kurzus', monthlyFee: 'hónap' };

/** The invoice for a paid order (once; again only after a definite failure). */
export async function issueInvoice(payload: Payload, orderId: number, now = new Date()): Promise<Invoice | null> {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1 });
  const gross = invoiceAmountFor(order);
  if (order.status !== 'paid' || gross <= 0) return null;
  const key = `order-${order.id}`;
  const existing = await byKey(payload, key);
  // issued or a draft: done; "sending": the outcome is unknown — a person checks, no second try
  if (existing && existing.status !== 'failed') return existing;

  const user = order.user as User;
  const rules = await billingSettings(payload);
  const vat = rules.vatMode as VatMode;
  const data: InvoiceData = {
    externalId: key,
    orderRef: `#${order.id}`,
    issueDate: todayInBudapest(now),
    // the payment's day (TO CONFIRM: or the workshop's / course's date)
    fulfilmentDate: todayInBudapest(order.paidAt ? new Date(order.paidAt) : now),
    prefix: rules.invoicePrefix || undefined,
    note: `Online fizetve bankkártyával (rendelés #${order.id}).`,
    buyer: buyerOf(user, order.billing),
    items: [{ name: order.label, quantity: 1, unit: UNIT[order.kind], gross }],
    vat,
  };
  return record(payload, existing, {
    key,
    kind: 'invoice',
    order: order.id,
    user: user.id,
    ...split(gross, vat),
    data: { ...data },
    send: (agentKey) => createInvoice(agentKey, data),
    what: `számla a #${order.id} rendeléshez`,
  });
}

type BillingDetails = {
  name?: string | null;
  zip?: string | null;
  city?: string | null;
  address?: string | null;
  country?: string | null;
  taxNumber?: string | null;
};

/** The buyer on an invoice: the billing details given (the order's, or the account's), else the name. */
export function buyerOf(
  user: Pick<User, 'email' | 'firstName' | 'lastName'>,
  b?: BillingDetails | null,
): InvoiceData['buyer'] {
  return {
    name: b?.name || [user.lastName, user.firstName].filter(Boolean).join(' '),
    country: b?.country || 'HU',
    zip: b?.zip ?? '',
    city: b?.city ?? '',
    address: b?.address ?? '',
    email: user.email,
    taxNumber: b?.taxNumber || undefined,
  };
}

/** Számlázz.hu needs a postal address on every invoice. */
export const hasAddress = (b: InvoiceData['buyer']) => Boolean(b.zip.trim() && b.city.trim() && b.address.trim());

/** One line of the monthly run (lib/invoicing/run): a szakmai month, or a kezdő instalment. */
export type TransferCharge = {
  key: string;
  userId: number;
  courseGroup: number;
  period?: string;
  part?: number;
  label: string;
  unit: string;
  gross: number;
  note?: string;
};

/**
 * An invoice to pay by transfer (Havi számlázás): unpaid, due in `transferDueDays`, e-mailed by
 * Számlázz.hu. Once per key; again only after a definite failure.
 */
export async function issueTransferInvoice(
  payload: Payload,
  c: TransferCharge,
  now = new Date(),
): Promise<Invoice | null> {
  const existing = await byKey(payload, c.key);
  if (existing && existing.status !== 'failed') return existing;
  const user = await payload.findByID({ collection: 'users', id: c.userId, depth: 0 });
  const rules = await billingSettings(payload);
  const vat = rules.vatMode as VatMode;
  const issueDate = todayInBudapest(now);
  const dueDate = todayInBudapest(new Date(now.getTime() + rules.transferDueDays * 864e5));
  const data: InvoiceData = {
    externalId: c.key,
    orderRef: c.period ?? (c.part ? `${c.part}. részlet` : ''),
    issueDate,
    fulfilmentDate: issueDate,
    prefix: rules.invoicePrefix || undefined,
    note: c.note,
    buyer: buyerOf(user, user.billing),
    items: [{ name: c.label, quantity: 1, unit: c.unit, gross: c.gross }],
    vat,
    payment: { method: 'transfer', dueDate },
  };
  return record(payload, existing, {
    key: c.key,
    kind: 'invoice',
    user: user.id,
    courseGroup: c.courseGroup,
    period: c.period,
    part: c.part,
    method: 'transfer',
    dueDate,
    ...split(c.gross, vat),
    data: { ...data },
    send: (agentKey) => createInvoice(agentKey, data),
    what: `számla: ${c.label} (${user.email})`,
  });
}

/** A storno of an issued invoice (a refund). In "off" mode a draft, like the invoice. */
export async function stornoInvoice(
  payload: Payload,
  invoiceId: number,
  reason: string,
  now = new Date(),
): Promise<Invoice | null> {
  const invoice = await payload.findByID({ collection: 'invoices', id: invoiceId, depth: 0 });
  if (invoice.kind !== 'invoice' || !['issued', 'draft'].includes(invoice.status)) return null;
  const key = `storno-${invoice.id}`;
  const existing = await byKey(payload, key);
  if (existing && existing.status !== 'failed') return existing;
  const email = (invoice.data as InvoiceData | null)?.buyer.email ?? '';
  const data = {
    invoiceNumber: invoice.number ?? '',
    externalId: key,
    issueDate: todayInBudapest(now),
    email,
    note: reason,
  };
  return record(payload, existing, {
    key,
    kind: 'storno',
    order: relId(invoice.order) ?? undefined,
    user: relId(invoice.user) ?? 0,
    courseGroup: relId(invoice.courseGroup) ?? undefined,
    period: invoice.period ?? undefined,
    part: invoice.part ?? undefined,
    method: invoice.method ?? undefined,
    net: invoice.net,
    vat: invoice.vat,
    gross: invoice.gross,
    stornoOf: invoice.id,
    data,
    // a draft invoice has no number at Számlázz.hu: its storno stays a draft too
    send: invoice.status === 'draft' ? null : (agentKey) => createStorno(agentKey, data),
    what: `sztornó a ${invoice.number ?? `#${invoice.id}`} számlához`,
  });
}

async function byKey(payload: Payload, key: string) {
  const { docs } = await payload.find({ collection: 'invoices', where: { key: { equals: key } }, depth: 0, limit: 1 });
  return docs[0] ?? null;
}

type Draft = Pick<Invoice, 'key' | 'kind' | 'net' | 'vat' | 'gross'> & {
  order?: number;
  user: number;
  courseGroup?: number;
  period?: string;
  part?: number;
  method?: Invoice['method'];
  dueDate?: string;
  stornoOf?: number;
  data: Record<string, unknown>;
  send: ((agentKey: string) => Promise<AgentResult>) | null;
  what: string;
};

/**
 * Stores the invoice, then (unless off) sends it: "sending" first, so a crash or a timeout leaves
 * a trace that says "check Számlázz.hu" rather than a silent second invoice on the next try.
 */
async function record(payload: Payload, existing: Invoice | null, d: Draft): Promise<Invoice | null> {
  const { send, what, ...fields } = d;
  let mode: InvoicingMode;
  try {
    mode = invoicingMode();
  } catch (err) {
    await alert(payload, what, errorMessage(err));
    return existing;
  }
  const live = mode !== 'off' && send;
  const base = { ...fields, mode, status: live ? ('sending' as const) : ('draft' as const), error: null };
  const row = existing
    ? await payload.update({ collection: 'invoices', id: existing.id, data: base })
    : await payload.create({ collection: 'invoices', data: base });
  if (!live) return row;

  let r: AgentResult;
  try {
    r = await send(process.env.SZAMLAZZ_AGENT_KEY ?? '');
  } catch (err) {
    // no answer (network, timeout): it may or may not exist at Számlázz.hu — stays "sending"
    const message = errorMessage(err);
    await payload.update({ collection: 'invoices', id: row.id, data: { error: message } });
    await alert(
      payload,
      what,
      `Nem jött válasz a Számlázz.hu-tól (${message}). Nézd meg a Számlázz.hu-ban, létrejött-e (külső azonosító: ${d.key}).`,
    );
    return row;
  }
  if (!r.ok) {
    await alert(payload, what, `A Számlázz.hu hibát adott: ${r.message} (kód: ${r.code}).`);
    return payload.update({
      collection: 'invoices',
      id: row.id,
      data: { status: 'failed', error: `${r.code}: ${r.message}` },
    });
  }
  return payload.update({
    collection: 'invoices',
    id: row.id,
    data: { status: 'issued', number: r.number, issuedAt: new Date().toISOString() },
  });
}

async function alert(payload: Payload, what: string, line: string) {
  payload.logger.error({ msg: `invoicing: ${what}: ${line}` });
  await sendStaffAlert(payload, await applicationSettings(payload), 'számlázási hiba', [`${what}:`, line]);
}

/** An issued invoice's PDF from Számlázz.hu (null: not sent there, or no answer). */
export async function invoicePdfFor(payload: Payload, invoice: Invoice): Promise<Uint8Array | null> {
  if (invoice.status !== 'issued' || !invoice.number || invoice.mode === 'off') return null;
  try {
    if (invoicingMode() === 'off') return null;
    return await invoicePdf(process.env.SZAMLAZZ_AGENT_KEY ?? '', invoice.number);
  } catch (err) {
    payload.logger.error({ err, msg: `invoice PDF failed for ${invoice.number}` });
    return null;
  }
}
