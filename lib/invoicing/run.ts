/**
 * Havi számlázás (/admin/szamlazas): for a month, who is due an invoice to pay by transfer —
 * - szakmai: every student of the szakmai groups running that month, at the group's Havidíj;
 * - kezdő: the later instalments of a paid sign-up's payment plan, the k-th due k−1 months after
 *   the course starts (earlier ones not yet invoiced are listed too).
 * Staff review the lines (untick, change an amount), then issue. A line's key makes it once only.
 */
import type { Payload } from 'payload';

import { monthLong, todayInBudapest } from '@/lib/dates';
import { relId, relIds } from '@/payload/rel';
import type { Invoice } from '@/payload-types';

import { buyerOf, hasAddress, issueTransferInvoice } from './service';

export type RunLine = {
  key: string;
  kind: 'monthly' | 'instalment';
  userId: number;
  name: string;
  email: string;
  groupId: number;
  groupTitle: string;
  /** On the invoice. */
  label: string;
  /** HUF, the suggested amount (staff may change it). */
  amount: number;
  period?: string;
  part?: number;
  parts?: number;
  /** Why it can't be issued now (e.g. no billing address). */
  problem?: string;
  /** Already invoiced (the line's key exists and didn't fail). */
  done?: { number: string | null; status: Invoice['status'] };
};

/** "2026-11" → "2026. november" */
export const monthLabel = (m: string) => `${m.slice(0, 4)}. ${monthLong(`${m}-01`)}`;
/** "2026-11" + 2 → "2027-01" */
export function addMonths(m: string, n: number) {
  const d = new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}
export const isMonth = (m: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
/** The k-th of `parts` instalments (whole forints; the last takes the rounding). */
export function instalment(total: number, parts: number, k: number) {
  const each = Math.round(total / parts);
  return k < parts ? each : total - each * (parts - 1);
}

const all = { limit: 0, pagination: false } as const;

export async function billingRun(payload: Payload, month: string): Promise<RunLine[]> {
  if (!isMonth(month)) return [];
  const first = `${month}-01`;
  const last = todayInBudapest(new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0, 12)));
  const lines: Omit<RunLine, 'name' | 'email' | 'problem' | 'done'>[] = [];

  // szakmai: the groups running in the month, with a monthly fee
  const { docs: groups } = await payload.find({
    collection: 'courseGroups',
    where: {
      and: [
        { type: { equals: 'szakmai' } },
        { monthlyFee: { greater_than: 0 } },
        { startDate: { less_than_equal: last } },
        { endDate: { greater_than_equal: first } },
      ],
    },
    depth: 0,
    sort: 'title',
    ...all,
  });
  for (const g of groups)
    for (const userId of relIds(g.students))
      lines.push({
        key: `monthly-${g.id}-${userId}-${month}`,
        kind: 'monthly',
        userId,
        groupId: g.id,
        groupTitle: g.title,
        label: `${g.title} — havidíj, ${monthLabel(month)}`,
        amount: g.monthlyFee ?? 0,
        period: month,
      });

  // kezdő: paid sign-ups with a plan in several parts, still in their group
  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: {
      and: [{ kind: { equals: 'beginner' } }, { status: { equals: 'paid' } }, { 'plan.parts': { greater_than: 1 } }],
    },
    depth: 0,
    ...all,
  });
  if (orders.length) {
    const { docs: apps } = await payload.find({
      collection: 'applications',
      where: { and: [{ order: { in: orders.map((o) => o.id) } }, { status: { equals: 'registered' } }] },
      depth: 1,
      ...all,
    });
    for (const o of orders) {
      const a = apps.find((x) => relId(x.order) === o.id);
      const g = a && typeof a.courseGroup === 'object' ? a.courseGroup : null;
      const userId = relId(a?.user);
      if (!a || !g?.startDate || !userId || !o.plan?.parts || !o.plan.total) continue;
      const startMonth = g.startDate.slice(0, 7);
      for (let k = 2; k <= o.plan.parts; k++) {
        if (addMonths(startMonth, k - 1) > month) break;
        lines.push({
          key: `part-${o.id}-${k}`,
          kind: 'instalment',
          userId,
          groupId: g.id,
          groupTitle: g.title,
          label: `${g.title} — ${o.plan.label ?? 'részletfizetés'} (${k}. részlet a ${o.plan.parts}-ből)`,
          amount: instalment(o.plan.total, o.plan.parts, k),
          part: k,
          parts: o.plan.parts,
        });
      }
    }
  }
  if (!lines.length) return [];

  const [{ docs: users }, { docs: invoices }] = await Promise.all([
    payload.find({
      collection: 'users',
      where: { id: { in: [...new Set(lines.map((l) => l.userId))] } },
      depth: 0,
      ...all,
    }),
    payload.find({ collection: 'invoices', where: { key: { in: lines.map((l) => l.key) } }, depth: 0, ...all }),
  ]);
  return lines.map((l) => {
    const u = users.find((x) => x.id === l.userId);
    const inv = invoices.find((i) => i.key === l.key && i.status !== 'failed');
    return {
      ...l,
      name: u ? [u.lastName, u.firstName].filter(Boolean).join(' ') : `#${l.userId}`,
      email: u?.email ?? '',
      problem: !u
        ? 'Nincs ilyen fiók.'
        : hasAddress(buyerOf(u, u.billing))
          ? undefined
          : 'Nincs számlázási cím (Adataim).',
      done: inv ? { number: inv.number ?? null, status: inv.status } : undefined,
    };
  });
}

export type RunResult = { key: string; ok: boolean; message: string };

/** Issues the picked lines (as recomputed now: only due, not yet invoiced, with an address). */
export async function issueRun(
  payload: Payload,
  month: string,
  picks: { key: string; amount: number }[],
  now = new Date(),
): Promise<RunResult[]> {
  const lines = await billingRun(payload, month);
  const results: RunResult[] = [];
  for (const pick of picks) {
    const l = lines.find((x) => x.key === pick.key);
    if (!l) {
      results.push({ key: pick.key, ok: false, message: 'Ez a tétel már nem esedékes.' });
      continue;
    }
    if (l.done || l.problem) {
      results.push({ key: l.key, ok: false, message: l.problem ?? 'Már kiállítva.' });
      continue;
    }
    const gross = Math.round(pick.amount);
    if (!(gross > 0)) {
      results.push({ key: l.key, ok: false, message: 'Az összeg legyen nagyobb nullánál.' });
      continue;
    }
    const inv = await issueTransferInvoice(
      payload,
      {
        key: l.key,
        userId: l.userId,
        courseGroup: l.groupId,
        period: l.period,
        part: l.part,
        label: l.label,
        unit: l.kind === 'monthly' ? 'hónap' : 'részlet',
        gross,
      },
      now,
    );
    results.push(
      !inv
        ? { key: l.key, ok: false, message: 'Nem sikerült (a munkatársak e-mailt kaptak).' }
        : inv.status === 'failed'
          ? { key: l.key, ok: false, message: inv.error ?? 'A Számlázz.hu hibát adott.' }
          : { key: l.key, ok: true, message: inv.number ?? (inv.status === 'draft' ? 'piszkozat' : 'küldés alatt') },
    );
  }
  return results;
}

export type OpenTransfer = {
  id: number;
  number: string | null;
  name: string;
  label: string;
  gross: number;
  dueDate: string | null;
  overdue: boolean;
};

/** Transfer invoices not yet marked paid (and not reversed), oldest due first. */
export async function openTransfers(payload: Payload, now = new Date()): Promise<OpenTransfer[]> {
  const { docs } = await payload.find({
    collection: 'invoices',
    where: {
      and: [
        { method: { equals: 'transfer' } },
        { kind: { equals: 'invoice' } },
        { status: { in: ['issued', 'draft'] } },
        { paidAt: { exists: false } },
      ],
    },
    depth: 1,
    sort: 'dueDate',
    ...all,
  });
  const { docs: stornos } = docs.length
    ? await payload.find({
        collection: 'invoices',
        where: { stornoOf: { in: docs.map((d) => d.id) } },
        depth: 0,
        ...all,
      })
    : { docs: [] };
  const reversed = new Set(stornos.map((s) => relId(s.stornoOf)));
  const today = todayInBudapest(now);
  return docs
    .filter((d) => !reversed.has(d.id))
    .map((d) => {
      const u = typeof d.user === 'object' ? d.user : null;
      const items = (d.data as { items?: { name: string }[] } | null)?.items;
      return {
        id: d.id,
        number: d.number ?? null,
        name: u ? [u.lastName, u.firstName].filter(Boolean).join(' ') : '',
        label: items?.[0]?.name ?? '',
        gross: d.gross,
        dueDate: d.dueDate?.slice(0, 10) ?? null,
        overdue: Boolean(d.dueDate && d.dueDate.slice(0, 10) < today),
      };
    });
}

/** "Befizetve": staff record that the transfer arrived. */
export async function markPaid(payload: Payload, invoiceId: number, now = new Date()) {
  const inv = await payload.findByID({ collection: 'invoices', id: invoiceId, depth: 0, disableErrors: true });
  if (inv?.method !== 'transfer' || inv.kind !== 'invoice')
    return { ok: false as const, reason: 'Nincs ilyen számla.' };
  await payload.update({ collection: 'invoices', id: invoiceId, data: { paidAt: now.toISOString() } });
  return { ok: true as const };
}
