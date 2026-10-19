// Phase 3B stage 4 (invoicing) in "off" mode: a paid order gets one draft invoice (retries don't
// make a second), a storno draft, the mode guards. Mock provider in-process; cleaned up.
import config from '@payload-config';
import { getPayload } from 'payload';

import { invoicingMode, issueInvoice, stornoInvoice } from '@/lib/invoicing/service';
import { afterPaid, applyPaymentUpdate, checkout } from '@/lib/payments/service';
import { relId } from '@/payload/rel';
import { MAILPIT } from './env';

const payload = await getPayload({ config });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const stamp = Date.now().toString(36);
const email = `b4.${stamp}@example.com`;
const start = new Date(Date.now() + 9 * 864e5);
start.setUTCHours(13, 0, 0, 0);
const s = await payload.create({
  collection: 'sessions',
  data: {
    kind: 'workshop',
    title: `Számla teszt ${stamp}`,
    start: start.toISOString(),
    end: new Date(start.getTime() + 2 * 3_600_000).toISOString(),
    locationType: 'unplaced',
    status: 'scheduled',
    workshop: { price: 5000, minParticipants: 2, maxParticipants: 10, bookable: true, workshopStatus: 'open' },
  },
});
const invoicesOf = async (orderId: number) =>
  (await payload.find({ collection: 'invoices', where: { order: { equals: orderId } }, depth: 0, sort: 'createdAt' }))
    .docs;
const alerts = async () =>
  (
    (await (
      await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent('subject:"számlázási hiba"')}`)
    ).json()) as { total: number }
  ).total;
let orderId = 0;
try {
  ok(invoicingMode() === 'off', 'the default mode is off');
  const r = await checkout(payload, null, {
    sessionId: s.id,
    lastName: 'Teszt',
    firstName: 'Szamla',
    email,
    phone: '+36301234567',
    billing: {
      name: 'Kovács & Társa Kft.',
      zip: '1027',
      city: 'Budapest',
      address: 'Frankel Leó út 1.',
      country: 'HU',
      taxNumber: '12345678-1-42',
    },
  });
  if (!r.ok) throw new Error(r.reason);
  const order = (await payload.find({ collection: 'orders', where: { token: { equals: r.token } }, depth: 0 })).docs[0];
  orderId = order.id;
  ok((await issueInvoice(payload, orderId)) === null, 'unpaid: no invoice');
  const [pay] = (await payload.find({ collection: 'payments', where: { order: { equals: orderId } }, depth: 0 })).docs;
  await payload.update({
    collection: 'mockPayments',
    id: Number(pay.providerPaymentId.replace('mock_', '')),
    data: { status: 'paid', paidAt: new Date().toISOString() },
  });
  await applyPaymentUpdate(payload, pay.providerPaymentId, 'return');
  await afterPaid(payload, orderId);
  let inv = await invoicesOf(orderId);
  ok(
    inv.length === 1 && inv[0].status === 'draft' && inv[0].mode === 'off' && !inv[0].number,
    `paid → one draft invoice, not sent (${inv.map((i) => i.status)})`,
  );
  const d = inv[0].data as {
    buyer: { name: string; taxNumber?: string; email: string };
    items: { gross: number; unit: string }[];
    vat: string;
    externalId: string;
  };
  ok(
    d.buyer.name === 'Kovács & Társa Kft.' && d.buyer.taxNumber === '12345678-1-42' && d.buyer.email === email,
    'the buyer from the billing details',
  );
  ok(
    d.items[0].gross === 5000 &&
      d.items[0].unit === 'alkalom' &&
      d.vat === 'AAM' &&
      inv[0].net === 5000 &&
      inv[0].vat === 0,
    '5000 Ft, AAM, one "alkalom"',
  );
  ok(
    d.externalId === `order-${orderId}` && !JSON.stringify(inv[0].data).includes('szamlaagentkulcs'),
    'external id set; no key stored',
  );

  await afterPaid(payload, orderId); // the job retried
  await issueInvoice(payload, orderId);
  ok((await invoicesOf(orderId)).length === 1, 'again (a job retry): still one invoice');

  const storno = await stornoInvoice(payload, inv[0].id, 'Visszatérítés');
  ok(
    storno?.kind === 'storno' && storno.status === 'draft' && relId(storno.stornoOf) === inv[0].id,
    'storno: a draft for the draft invoice',
  );
  await stornoInvoice(payload, inv[0].id, 'Visszatérítés');
  inv = await invoicesOf(orderId);
  ok(inv.length === 2, 'storno again: still one storno');

  // the guards: a wrong mode never sends — it tells staff instead
  const before = await alerts();
  await payload.delete({ collection: 'invoices', where: { order: { equals: orderId } } }).catch(() => {});
  await payload.db.deleteMany({ collection: 'invoices', where: { order: { equals: orderId } } });
  process.env.INVOICING_MODE = 'live';
  let threw = '';
  try {
    invoicingMode();
  } catch (e) {
    threw = (e as Error).message;
  }
  ok(/only allowed on the live site/.test(threw), `live refused here (${threw})`);
  ok(
    (await issueInvoice(payload, orderId)) === null && (await invoicesOf(orderId)).length === 0,
    'live here: nothing made',
  );
  process.env.INVOICING_MODE = 'test';
  const key = process.env.SZAMLAZZ_AGENT_KEY;
  delete process.env.SZAMLAZZ_AGENT_KEY;
  await issueInvoice(payload, orderId);
  ok((await invoicesOf(orderId)).length === 0, 'test without a key: nothing made');
  if (key) process.env.SZAMLAZZ_AGENT_KEY = key;
  process.env.INVOICING_MODE = 'off';
  await new Promise((r) => setTimeout(r, 1500));
  ok((await alerts()) >= before + 2, 'staff alerted both times');
} catch (e) {
  console.error(e);
  failures++;
} finally {
  const users = await payload.find({ collection: 'users', where: { email: { equals: email } }, depth: 0 });
  const ids = users.docs.map((u) => u.id);
  if (orderId) {
    await payload.db.deleteMany({ collection: 'invoices', where: { order: { equals: orderId } } });
    const pays = await payload.find({ collection: 'payments', where: { order: { equals: orderId } }, depth: 0 });
    for (const p of pays.docs)
      await payload.db
        .deleteOne({
          collection: 'mockPayments',
          where: { id: { equals: Number(p.providerPaymentId.replace('mock_', '')) } },
        })
        .catch(() => {});
    await payload.db.deleteMany({ collection: 'payments', where: { order: { equals: orderId } } });
    await payload.db
      .deleteMany({ collection: 'payload-jobs', where: { 'input.orderId': { equals: orderId } } })
      .catch(() => {});
    await payload.update({ collection: 'applications', where: { user: { in: ids } }, data: { order: null } });
    await payload.db.deleteMany({ collection: 'orders', where: { id: { equals: orderId } } });
  }
  await payload.delete({ collection: 'applications', where: { user: { in: ids } } });
  await payload.delete({ collection: 'sessions', id: s.id });
  if (ids.length) await payload.delete({ collection: 'users', where: { id: { in: ids } } });
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
