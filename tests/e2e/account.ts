// Phase 3B stage 5: /fiokom/szamlaim (orders, invoices, unfinished payments), the PDF route's
// access, billing details in /fiokom/adatok, refunds made in the provider's dashboard.
// Payments with the mock provider in-process; pages on the dev server (a test account with a
// generated password). Everything is cleaned up.
import { randomBytes } from 'node:crypto';

import config from '@payload-config';
import { getPayload } from 'payload';

import { invoicePdfFor } from '@/lib/invoicing/service';
import { myOrders } from '@/lib/payments/my-orders';
import { afterPaid, applyPaymentUpdate, checkout } from '@/lib/payments/service';
import { BASE, launch, MAILPIT, OUT } from './env';

const payload = await getPayload({ config });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stamp = Date.now().toString(36);
const password = randomBytes(12).toString('base64url');
const billing = {
  name: 'Teszt Elek',
  zip: '1027',
  city: 'Budapest',
  address: 'Frankel Leó út 1.',
  country: 'HU',
  taxNumber: '',
};
const mkUser = (who: string) =>
  payload.create({
    collection: 'users',
    data: {
      email: `b5.${who}.${stamp}@example.com`,
      password,
      firstName: who,
      lastName: 'Teszt',
      roles: ['student'],
      _verified: true,
    } as never,
  });
const anna = await mkUser('anna');
const other = await mkUser('bela');
const sessions: number[] = [];
const mkDate = async (days: number) => {
  const start = new Date(Date.now() + days * 864e5);
  start.setUTCHours(13, 0, 0, 0);
  const s = await payload.create({
    collection: 'sessions',
    data: {
      kind: 'workshop',
      title: `B5 teszt ${stamp} ${days}`,
      start: start.toISOString(),
      end: new Date(start.getTime() + 7.2e6).toISOString(),
      locationType: 'unplaced',
      status: 'scheduled',
      workshop: { price: 5000, minParticipants: 2, maxParticipants: 10, bookable: true, workshopStatus: 'open' },
    },
  });
  sessions.push(s.id);
  return s;
};
const asUser = { lastName: '', firstName: '', email: '', phone: '+36301234567', billing };
const payOrder = async (token: string, _refunded = 0) => {
  const order = (await payload.find({ collection: 'orders', where: { token: { equals: token } }, depth: 0 })).docs[0];
  const [p] = (await payload.find({ collection: 'payments', where: { order: { equals: order.id } }, depth: 0 })).docs;
  const mockId = Number(p.providerPaymentId.replace('mock_', ''));
  await payload.update({
    collection: 'mockPayments',
    id: mockId,
    data: { status: 'paid', paidAt: new Date().toISOString() },
  });
  await applyPaymentUpdate(payload, p.providerPaymentId, 'webhook');
  await afterPaid(payload, order.id);
  return { order, payment: p, mockId };
};
const alerts = async (subject: string) =>
  (
    (await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`subject:"${subject}"`)}`)).json()) as {
      total: number;
    }
  ).total;

const browser = await launch();
try {
  const viewer = { ...anna, collection: 'users' as const };
  // three dates: one paid (then refunded in full), one paid (refunded in part), one left unpaid
  const [d1, d2, d3] = [await mkDate(9), await mkDate(10), await mkDate(11)];
  const r1 = await checkout(payload, viewer as never, { sessionId: d1.id, ...asUser });
  const r2 = await checkout(payload, viewer as never, { sessionId: d2.id, ...asUser });
  const r3 = await checkout(payload, viewer as never, { sessionId: d3.id, ...asUser });
  if (!r1.ok || !r2.ok || !r3.ok) throw new Error('checkout failed');
  const p1 = await payOrder(r1.token);
  const p2 = await payOrder(r2.token);

  // ── A: the account's orders ──────────────────────────────────────────────
  const mine = await myOrders(payload, viewer as never);
  ok(
    mine.paid.length === 2 && mine.paid.every((o) => o.status === 'paid' && o.amount === 5000),
    'two paid orders listed',
  );
  ok(
    mine.unpaid.length === 1 && mine.unpaid[0].href.includes('/fizetes/eredmeny?rendeles='),
    'the unpaid one: "Fizetés folytatása" to its order page',
  );
  ok(
    (await myOrders(payload, { ...other, collection: 'users' } as never)).paid.length === 0,
    "someone else doesn't see them",
  );

  // ── B: the PDF route's access ────────────────────────────────────────────
  const [inv1] = (await payload.find({ collection: 'invoices', where: { order: { equals: p1.order.id } }, depth: 0 }))
    .docs;
  ok(inv1?.status === 'draft', 'the paid order has its invoice (a draft: invoicing is off here)');
  ok(
    (await fetch(`${BASE}/fiokom/szamlaim/${inv1?.id}`, { redirect: 'manual' })).status === 401,
    'PDF without logging in: 401',
  );
  ok((await invoicePdfFor(payload, inv1)) === null, 'a draft has no PDF');

  // ── C: refunds made in the provider's dashboard ─────────────────────────
  const before = await alerts('Figyelem: visszatérítés');
  await payload.update({ collection: 'mockPayments', id: p1.mockId, data: { amountRefunded: 5000 } });
  await applyPaymentUpdate(payload, p1.payment.providerPaymentId, 'webhook');
  const o1 = await payload.findByID({ collection: 'orders', id: p1.order.id, depth: 0 });
  const inv = (
    await payload.find({
      collection: 'invoices',
      where: { order: { equals: p1.order.id } },
      depth: 0,
      sort: 'createdAt',
    })
  ).docs;
  ok(o1.status === 'refunded', 'full refund: the order is "Visszatérítve"');
  ok(inv.length === 2 && inv[1].kind === 'storno', 'full refund: the invoice is reversed (storno)');
  await sleep(800);
  ok((await alerts('Figyelem: visszatérítés')) > before, 'staff told');
  const a1 = await payload.findByID({ collection: 'applications', id: Number(o1.application), depth: 0 });
  ok(a1.status === 'registered', 'the sign-up itself is left as it is');
  await applyPaymentUpdate(payload, p1.payment.providerPaymentId, 'webhook');
  ok(
    (await payload.find({ collection: 'invoices', where: { order: { equals: p1.order.id } }, depth: 0 })).totalDocs ===
      2,
    'the same notice again: nothing more',
  );
  await payload.update({ collection: 'mockPayments', id: p2.mockId, data: { amountRefunded: 2000 } });
  await applyPaymentUpdate(payload, p2.payment.providerPaymentId, 'webhook');
  const o2 = await payload.findByID({ collection: 'orders', id: p2.order.id, depth: 0 });
  ok(
    o2.status === 'partially_refunded' &&
      (
        await payload.find({
          collection: 'invoices',
          where: { and: [{ order: { equals: p2.order.id } }, { kind: { equals: 'storno' } }] },
        })
      ).totalDocs === 0,
    'partial refund: "Részben visszatérítve", no storno (staff correct it)',
  );

  // ── D: the pages, logged in ──────────────────────────────────────────────
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  await page.goto(`${BASE}/belepes?vissza=/fiokom`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.type('input[name=email]', anna.email);
  await page.type('input[name=password]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }),
    page.keyboard.press('Enter'),
  ]);
  ok(page.url().includes('/fiokom'), `logged in (${page.url()})`);
  ok(
    await page.evaluate(() => document.body.innerText.includes('Befejezetlen fizetés')),
    'overview: the unfinished payment',
  );
  await page.goto(`${BASE}/fiokom/szamlaim`, { waitUntil: 'networkidle2', timeout: 120000 });
  const text = await page.evaluate(() => document.body.innerText);
  ok(
    text.includes('Számláim') && text.includes('Visszatérítve') && text.includes('Részben visszatérítve'),
    'Számláim: the orders with their state',
  );
  await page.screenshot({ path: `${OUT}/b5-szamlaim.png`, fullPage: true });
  const status = await page.evaluate(
    async (id: number) => (await fetch(`/fiokom/szamlaim/${id}`)).status,
    inv1?.id ?? 0,
  );
  ok(status === 502 || status === 200, `own invoice's PDF: allowed (${status}: no PDF for a draft)`);
  // someone else's invoice
  const page2 = await (await browser.createBrowserContext()).newPage();
  await page2.goto(`${BASE}/belepes`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page2.type('input[name=email]', other.email);
  await page2.type('input[name=password]', password);
  await Promise.all([
    page2.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }),
    page2.keyboard.press('Enter'),
  ]);
  const forbidden = await page2.evaluate(
    async (id: number) => (await fetch(`/fiokom/szamlaim/${id}`)).status,
    inv1?.id ?? 0,
  );
  ok(forbidden === 403, `someone else's invoice PDF: 403 (${forbidden})`);
  // billing details
  await page.goto(`${BASE}/fiokom/adatok`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.evaluate(() => {
    const f = document.querySelector('input[name=billingName]')?.closest('form') as HTMLFormElement;
    (f.querySelector('input[name=billingName]') as HTMLInputElement).value = 'Kovács Kft.';
    (f.querySelector('input[name=taxNumber]') as HTMLInputElement).value = '12345678-1-42';
    (f.querySelector('button[type=submit]') as HTMLButtonElement).click();
  });
  await page.waitForFunction(() => document.body.innerText.includes('A következő számlán'), { timeout: 60000 });
  const saved = await payload.findByID({ collection: 'users', id: anna.id, depth: 0 });
  ok(
    saved.billing?.name === 'Kovács Kft.' && saved.billing?.taxNumber === '12345678-1-42',
    'Adataim: billing details saved',
  );
  await page.screenshot({ path: `${OUT}/b5-adatok.png`, fullPage: true });
} catch (err) {
  console.error(err);
  failures++;
} finally {
  await browser.close();
  const ids = [anna.id, other.id];
  const orders = await payload.find({
    collection: 'orders',
    where: { user: { in: ids } },
    depth: 0,
    limit: 0,
    pagination: false,
  });
  const orderIds = orders.docs.map((o) => o.id);
  await payload.db.deleteMany({ collection: 'invoices', where: { order: { in: orderIds } } });
  const pays = await payload.find({
    collection: 'payments',
    where: { order: { in: orderIds } },
    depth: 0,
    limit: 0,
    pagination: false,
  });
  for (const p of pays.docs)
    await payload.db
      .deleteOne({
        collection: 'mockPayments',
        where: { id: { equals: Number(p.providerPaymentId.replace('mock_', '')) } },
      })
      .catch(() => {});
  await payload.db.deleteMany({ collection: 'payments', where: { order: { in: orderIds } } });
  await payload.db
    .deleteMany({ collection: 'payload-jobs', where: { 'input.orderId': { in: orderIds } } })
    .catch(() => {});
  await payload.update({ collection: 'applications', where: { user: { in: ids } }, data: { order: null } });
  await payload.db.deleteMany({ collection: 'orders', where: { id: { in: orderIds } } });
  await payload.delete({ collection: 'applications', where: { user: { in: ids } } });
  for (const id of sessions) await payload.delete({ collection: 'sessions', id }).catch(() => {});
  await payload.delete({ collection: 'users', where: { id: { in: ids } } });
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
