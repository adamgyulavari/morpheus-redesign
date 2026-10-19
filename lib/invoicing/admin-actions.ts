'use server';

/** Havi számlázás (/admin/szamlazas): the run for a month, issuing, "Befizetve". Staff only. */
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { userIsStaffOrAdmin } from '@/payload/access';

import { billingRun, isMonth, issueRun, markPaid, openTransfers } from './run';
import { invoicingMode } from './service';

const isStaff = async () => userIsStaffOrAdmin(await getCurrentUser());

export async function billingRunData(month: string) {
  if (!(await isStaff()) || !isMonth(month)) return null;
  const payload = await payloadClient();
  let mode: string;
  try {
    mode = invoicingMode();
  } catch (err) {
    mode = `hiba: ${(err as Error).message}`;
  }
  const [lines, open] = await Promise.all([billingRun(payload, month), openTransfers(payload)]);
  return { lines, open, mode };
}

export async function issueRunAction(month: string, picks: { key: string; amount: number }[]) {
  if (!(await isStaff())) return null;
  return issueRun(await payloadClient(), month, picks.slice(0, 500));
}

export async function markPaidAction(invoiceId: number) {
  if (!(await isStaff())) return { ok: false as const, reason: 'Ehhez munkatársi jogosultság kell.' };
  return markPaid(await payloadClient(), invoiceId);
}
