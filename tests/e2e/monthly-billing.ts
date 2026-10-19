// Havi számlázás: szakmai monthly fees and kezdő instalments — the run, issuing (off mode, then one
// real transfer invoice on the Számlázz.hu TEST account), "Befizetve", the student's list, the admin
// page. Own groups / accounts (generated passwords); everything is cleaned up.
import { randomBytes } from 'node:crypto';

import config from '@payload-config';
import { getPayload } from 'payload';

import { addMonths, billingRun, issueRun, markPaid, openTransfers } from '@/lib/invoicing/run';
import { myOrders } from '@/lib/payments/my-orders';
import { afterPaid, applyPaymentUpdate, checkoutCourse } from '@/lib/payments/service';
import { BASE, launch, OUT } from './env';

const payload = await getPayload({ config });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const stamp = Date.now().toString(36);
const password = randomBytes(12).toString('base64url');
const month = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Budapest',
  year: 'numeric',
  month: '2-digit',
}).format(new Date());
const billing = {
  name: 'Teszt Elek',
  zip: '1027',
  city: 'Budapest',
  address: 'Frankel Leó út 1.',
  country: 'HU',
  taxNumber: '',
};
const users: number[] = [];
const groups: number[] = [];
const mkUser = async (who: string, data: Record<string, unknown> = {}) => {
  const u = await payload.create({
    collection: 'users',
    data: {
      email: `b6.${who}.${stamp}@example.com`,
      password,
      firstName: who,
      lastName: 'Teszt',
      _verified: true,
      ...data,
    } as never,
  });
  users.push(u.id);
  return u;
};
const day = (offsetDays: number) => new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10);
const browser = await launch();
try {
  // ── setup ────────────────────────────────────────────────────────────────
  const zita = await mkUser('zita', { roles: ['student'], billing });
  const noaddr = await mkUser('noaddr', { roles: ['student'] });
  const staff = await mkUser('staff');
  // a new account is always a student (the Users hook): the role is given afterwards, as staff do
  await payload.update({ collection: 'users', id: staff.id, data: { roles: ['staff'] } });
  const szakmai = await payload.create({
    collection: 'courseGroups',
    data: {
      title: `B6 szakmai ${stamp}`,
      type: 'szakmai',
      startDate: day(-40),
      endDate: day(200),
      monthlyFee: 45000,
      students: [zita.id, noaddr.id],
    } as never,
  });
  groups.push(szakmai.id);
  const course = (
    await payload.find({ collection: 'courses', where: { signupMode: { equals: 'beginner' } }, depth: 0, limit: 1 })
  ).docs[0];
  const kezdo = await payload.create({
    collection: 'courseGroups',
    data: {
      title: `B6 kezdő ${stamp}`,
      type: 'kezdo',
      course: course.id,
      startDate: `${month}-28`,
      endDate: day(150),
      signup: { mode: 'open', kind: 'beginner', capacity: 10 },
    } as never,
  });
  groups.push(kezdo.id);
  await payload.update({ collection: 'courseGroups', id: kezdo.id, data: { signup: { payOnline: true } } as never });
  const three = (kezdo.signup?.options ?? []).find((o) => o.installments === 3);
  const kata = await mkUser('kata', { roles: ['student'] });
  const r = await checkoutCourse(payload, { ...kata, collection: 'users' } as never, {
    groupId: kezdo.id,
    optionId: three?.id ?? '',
    lastName: '',
    firstName: '',
    email: '',
    phone: '+36301234567',
    billing,
  });
  if (!r.ok) throw new Error(r.reason);
  const order = (await payload.find({ collection: 'orders', where: { token: { equals: r.token } }, depth: 0 })).docs[0];
  ok(
    order.plan?.parts === 3 && order.plan.total === 180000 && order.amountDue === 60000,
    `the order keeps the plan (${order.plan?.label}, ${order.plan?.parts} × , ${order.plan?.total} Ft)`,
  );
  const [p] = (await payload.find({ collection: 'payments', where: { order: { equals: order.id } }, depth: 0 })).docs;
  await payload.update({
    collection: 'mockPayments',
    id: Number(p.providerPaymentId.replace('mock_', '')),
    data: { status: 'paid', paidAt: new Date().toISOString() },
  });
  await applyPaymentUpdate(payload, p.providerPaymentId, 'webhook');
  await afterPaid(payload, order.id);

  // ── the run ──────────────────────────────────────────────────────────────
  const now = await billingRun(payload, month);
  const mine = now.filter((l) => l.groupId === szakmai.id || l.groupId === kezdo.id);
  const zLine = mine.find((l) => l.userId === zita.id);
  const nLine = mine.find((l) => l.userId === noaddr.id);
  ok(
    zLine?.kind === 'monthly' && zLine.amount === 45000 && zLine.label.includes('havidíj'),
    `szakmai: ${zLine?.label}, ${zLine?.amount} Ft`,
  );
  ok(nLine?.problem?.includes('számlázási cím'), `no billing address: flagged (${nLine?.problem})`);
  ok(!mine.some((l) => l.kind === 'instalment'), 'kezdő: nothing due in the starting month');
  const next = (await billingRun(payload, addMonths(month, 1))).filter((l) => l.groupId === kezdo.id);
  ok(
    next.length === 1 && next[0].part === 2 && next[0].amount === 60000,
    `next month: the 2nd instalment (${next.map((l) => l.label)})`,
  );
  const later = (await billingRun(payload, addMonths(month, 2))).filter((l) => l.groupId === kezdo.id);
  ok(later.map((l) => l.part).join(',') === '2,3', 'two months on: 2nd (still open) and 3rd');

  // ── issuing (off mode: drafts) ───────────────────────────────────────────
  const res = await issueRun(payload, month, [
    { key: zLine?.key ?? '', amount: 45000 },
    { key: nLine?.key ?? '', amount: 45000 },
  ]);
  ok(res[0]?.ok && !res[1]?.ok, `issued the one with an address, refused the other (${res.map((x) => x.message)})`);
  const [inv] = (await payload.find({ collection: 'invoices', where: { key: { equals: zLine?.key } }, depth: 0 })).docs;
  ok(
    inv?.method === 'transfer' &&
      inv.period === month &&
      inv.dueDate &&
      !inv.paidAt &&
      (inv.data as { payment?: { method: string } }).payment?.method === 'transfer',
    'a transfer invoice, with the month and a due date, unpaid',
  );
  const again = await issueRun(payload, month, [{ key: zLine?.key ?? '', amount: 45000 }]);
  ok(
    !again[0]?.ok &&
      (await payload.find({ collection: 'invoices', where: { key: { equals: zLine?.key } } })).totalDocs === 1,
    'issuing it again: refused, still one',
  );
  const nextKey = next[0]?.key ?? '';
  const edited = await issueRun(payload, addMonths(month, 1), [{ key: nextKey, amount: 55000 }]);
  const [instInv] = (await payload.find({ collection: 'invoices', where: { key: { equals: nextKey } }, depth: 0 }))
    .docs;
  ok(
    edited[0]?.ok && instInv?.gross === 55000 && instInv.part === 2,
    'an edited amount (55 000 Ft) is what gets invoiced',
  );
  ok(
    (await billingRun(payload, addMonths(month, 2)))
      .filter((l) => l.groupId === kezdo.id && !l.done)
      .map((l) => l.part)
      .join(',') === '3',
    'the 2nd is done; the 3rd still due',
  );

  // ── paid ─────────────────────────────────────────────────────────────────
  let open = (await openTransfers(payload)).filter((o) => o.id === inv?.id || o.id === instInv?.id);
  ok(open.length === 2, 'both wait for payment');
  await markPaid(payload, inv?.id ?? 0);
  open = (await openTransfers(payload)).filter((o) => o.id === inv?.id || o.id === instInv?.id);
  ok(open.length === 1 && open[0].id === instInv?.id, '"Befizetve": off the list');
  const zBills = (await myOrders(payload, { ...zita, collection: 'users' } as never)).bills;
  ok(
    zBills.length === 1 && zBills[0].paid && zBills[0].label.includes('havidíj'),
    "the student's Számláim: the monthly fee, paid",
  );

  // ── one real transfer invoice on the Számlázz.hu TEST account ───────────
  if (process.env.SZAMLAZZ_AGENT_KEY) {
    await payload.db.deleteMany({ collection: 'invoices', where: { key: { equals: zLine?.key } } });
    process.env.INVOICING_MODE = 'test';
    const live = await issueRun(payload, month, [{ key: zLine?.key ?? '', amount: 45000 }]);
    process.env.INVOICING_MODE = 'off';
    ok(live[0]?.ok && /^[A-Z]/.test(live[0].message), `test account: issued ${live[0]?.message}`);
  }

  // ── the admin page ───────────────────────────────────────────────────────
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1100 });
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.type('input[name=email]', staff.email);
  await page.type('input[name=password]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }),
    page.keyboard.press('Enter'),
  ]);
  await page.goto(`${BASE}/admin/szamlazas`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.includes('Szakmai havidíj'), { timeout: 60000 });
  const t = await page.evaluate(() => document.body.innerText);
  ok(
    t.includes(`B6 szakmai ${stamp}`) && t.includes('Befizetésre vár') && t.includes('Számlák kiállítása'),
    'the admin page lists the month',
  );
  ok(
    await page.evaluate(() =>
      [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/admin/szamlazas'),
    ),
    'the sidebar links it',
  );
  await page.screenshot({ path: `${OUT}/b6-admin.png`, fullPage: true });
} catch (err) {
  console.error(err);
  failures++;
} finally {
  await browser.close();
  const orders = await payload.find({
    collection: 'orders',
    where: { user: { in: users } },
    depth: 0,
    limit: 0,
    pagination: false,
  });
  const orderIds = orders.docs.map((o) => o.id);
  await payload.db.deleteMany({ collection: 'invoices', where: { user: { in: users } } });
  const pays = await payload.find({
    collection: 'payments',
    where: { order: { in: orderIds } },
    depth: 0,
    limit: 0,
    pagination: false,
  });
  for (const x of pays.docs)
    await payload.db
      .deleteOne({
        collection: 'mockPayments',
        where: { id: { equals: Number(x.providerPaymentId.replace('mock_', '')) } },
      })
      .catch(() => {});
  await payload.db.deleteMany({ collection: 'payments', where: { order: { in: orderIds } } });
  await payload.db
    .deleteMany({ collection: 'payload-jobs', where: { 'input.orderId': { in: orderIds } } })
    .catch(() => {});
  await payload.update({ collection: 'applications', where: { user: { in: users } }, data: { order: null } });
  await payload.db.deleteMany({ collection: 'orders', where: { id: { in: orderIds } } });
  await payload.delete({ collection: 'applications', where: { user: { in: users } } });
  for (const id of groups) await payload.delete({ collection: 'courseGroups', id }).catch(() => {});
  await payload.delete({ collection: 'users', where: { id: { in: users } } });
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
