// Phase 3B stage 1 in a browser: /nyitott-alkalmak → /fizetes → mock page → result page. Own date; cleaned up.

import config from '@payload-config';
import { getPayload } from 'payload';
import { BASE, launch, OUT } from './env';

const payload = await getPayload({ config });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const T = { timeout: 120000 };
const stamp = Date.now().toString(36);
const email = `b1ui.${stamp}@example.com`;
const start = new Date(Date.now() + 9 * 864e5);
start.setUTCHours(13, 0, 0, 0);
const session = await payload.create({
  collection: 'sessions',
  data: {
    kind: 'workshop',
    title: `UI teszt ${stamp}`,
    start: start.toISOString(),
    end: new Date(start.getTime() + 2 * 3_600_000).toISOString(),
    locationType: 'unplaced',
    status: 'scheduled',
    workshop: { price: 5000, minParticipants: 2, maxParticipants: 10, bookable: true, workshopStatus: 'open' },
  },
});
const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  const errors: string[] = [];
  page.on('pageerror', (e: unknown) => errors.push(String(e)));
  await sleep(1500); // the public page re-renders after the new date
  await page.goto(`${BASE}/nyitott-alkalmak/`, { waitUntil: 'load', ...T });
  const href = await page.evaluate(
    (id: string) => (document.querySelector(`a[href="/fizetes?alkalom=${id}"]`) as HTMLAnchorElement | null)?.href,
    session.code ?? '',
  );
  ok(href, 'the date\'s "Jelentkezem" leads to /fizetes');
  await page.goto(`${BASE}/fizetes?alkalom=${session.code}`, { waitUntil: 'load', ...T });
  await page.waitForSelector('input[name=lastName]', T);
  await page.type('input[name=lastName]', 'Teszt');
  await page.type('input[name=firstName]', 'Ugor');
  await page.type('input[name=email]', email);
  await page.type('input[name=phone]', '+36301234567');
  await page.type('input[name=billingName]', 'Teszt Ugor');
  await page.type('input[name=zip]', '1027');
  await page.type('input[name=city]', 'Budapest');
  await page.type('input[name=address]', 'Frankel Leó út 1.');
  await page.evaluate(() => {
    (document.querySelector('input[name=terms]') as HTMLInputElement).click();
  });
  ok(!(await page.$('input[name=cancellation]')), 'one terms checkbox');
  await page.screenshot({ path: `${OUT}/b1-checkout.png`, fullPage: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', ...T }),
    page.evaluate(() => (document.querySelector('form button[type=submit]') as HTMLElement).click()),
  ]);
  ok(page.url().includes('/fizetes/mock/mock_'), `to the mock payment page (${page.url()})`);
  await page.screenshot({ path: `${OUT}/b1-mock.png` });
  // the payment page closed: the e-mailed link (the order page) offers "Fizetés"
  const orders = await payload.find({ collection: 'orders', where: { 'user.email': { equals: email } }, depth: 0 });
  await page.goto(`${BASE}/fizetes/eredmeny?rendeles=${orders.docs[0]?.token}`, { waitUntil: 'load', ...T });
  await page.waitForFunction(() => document.body.innerText.includes('Fizetésre vár'), T);
  ok(true, 'the e-mailed link: "Fizetésre vár" with a pay button');
  await page.screenshot({ path: `${OUT}/b1-unpaid.png` });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', ...T }),
    page.evaluate(() =>
      (
        [...document.querySelectorAll('button')].find((b) => b.textContent?.startsWith('Fizetés —')) as HTMLElement
      ).click(),
    ),
  ]);
  ok(page.url().includes('/fizetes/mock/mock_'), 'its "Fizetés" leads to the payment page again');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', ...T }),
    page.evaluate(() =>
      (
        [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Fizetés') as HTMLElement
      ).click(),
    ),
  ]);
  ok(page.url().includes('/fizetes/eredmeny?rendeles='), 'back to the result page');
  await page.waitForFunction(() => document.body.innerText.includes('Sikeres fizetés'), T);
  ok(true, 'the result page says "Sikeres fizetés"');
  await page.screenshot({ path: `${OUT}/b1-result.png` });
  ok(errors.length === 0, `no page errors (${errors.join(' | ')})`);
} catch (e) {
  console.error(e);
  failures++;
} finally {
  await browser.close();
  const users = await payload.find({ collection: 'users', where: { email: { equals: email } } });
  const ids = users.docs.map((u) => u.id);
  const orders = await payload.find({
    collection: 'orders',
    where: { user: { in: ids } },
    limit: 0,
    pagination: false,
  });
  const orderIds = orders.docs.map((o) => o.id);
  const pays = await payload.find({
    collection: 'payments',
    where: { order: { in: orderIds } },
    limit: 0,
    pagination: false,
  });
  await payload.db
    .deleteMany({ collection: 'payload-jobs', where: { 'input.orderId': { in: orderIds } } })
    .catch(() => {});
  for (const p of pays.docs) {
    await payload.db
      .deleteOne({
        collection: 'mockPayments',
        where: { id: { equals: Number(p.providerPaymentId.replace('mock_', '')) } },
      })
      .catch(() => {});
    await payload.db.deleteOne({ collection: 'payments', where: { id: { equals: p.id } } });
  }
  await payload.update({ collection: 'applications', where: { user: { in: ids } }, data: { order: null } });
  await payload.db.deleteMany({ collection: 'invoices', where: { order: { in: orders.docs.map((o) => o.id) } } });
  for (const o of orders.docs) await payload.db.deleteOne({ collection: 'orders', where: { id: { equals: o.id } } });
  await payload.delete({ collection: 'applications', where: { user: { in: ids } } });
  await payload.delete({ collection: 'sessions', id: session.id });
  await payload.delete({ collection: 'users', where: { id: { in: ids } } });
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
