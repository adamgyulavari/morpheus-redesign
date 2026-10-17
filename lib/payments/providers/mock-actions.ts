'use server';

/**
 * The mock checkout's buttons: set the fake payment's outcome, call our webhook the way a real
 * provider would (only the id, form-encoded), then back to the result page.
 */
import config from '@payload-config';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';

import { mockActive } from '.';

export async function mockOutcomeAction(id: string, outcome: 'paid' | 'failed' | 'canceled') {
  if (!mockActive()) throw new Error('mock payments are off');
  const m = /^mock_(\d+)$/.exec(id);
  if (!m) throw new Error('bad id');
  const payload = await getPayload({ config });
  const p = await payload.findByID({ collection: 'mockPayments', id: Number(m[1]) });
  if (p.status === 'pending')
    await payload.update({
      collection: 'mockPayments',
      id: p.id,
      data: { status: outcome, ...(outcome === 'paid' ? { paidAt: new Date().toISOString() } : {}) },
    });
  if (p.webhookUrl)
    await fetch(p.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id }).toString(),
    }).catch((err) => payload.logger.error({ err, msg: 'mock webhook call failed' }));
  redirect(p.returnUrl ?? '/');
}
