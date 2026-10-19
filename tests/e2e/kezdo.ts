// Phase 3B stage 3: kezdő with online payment (mock provider in-process, Mailpit). A test group on
// the Kezdő course; the course's switches are restored and everything is cleaned up.
import config from '@payload-config';
import { getPayload, type TypedUser } from 'payload';

import { admit, signUp } from '@/lib/applications/server';
import { afterPaid, applyPaymentUpdate, checkoutCourse, dueNow, orderStatus } from '@/lib/payments/service';
import { relIds } from '@/payload/rel';
import { MAILPIT } from './env';

const payload = await getPayload({ config });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stamp = Date.now().toString(36);
const emails: string[] = [];
const billing = {
  name: 'Teszt Elek',
  zip: '1027',
  city: 'Budapest',
  address: 'Frankel Leó út 1.',
  country: 'HU',
  taxNumber: '',
};
const guest = (first: string) => {
  const email = `b3.${first.toLowerCase()}.${stamp}@example.com`;
  emails.push(email);
  return { lastName: 'Teszt', firstName: first, email, phone: '+36301234567', billing };
};
const mail = async (to: string, subject: string) => {
  for (let i = 0; i < 20; i++) {
    const r = (await (
      await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}" subject:"${subject}"`)}`)
    ).json()) as { messages: unknown[] };
    if (r.messages.length) return r.messages.length;
    await sleep(400);
  }
  return 0;
};
const course = (
  await payload.find({ collection: 'courses', where: { signupMode: { equals: 'beginner' } }, depth: 0, limit: 1 })
).docs[0];
const before = { openWithoutGroup: course.openWithoutGroup };
const start = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
const end = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10);
const group = await payload.create({
  collection: 'courseGroups',
  data: {
    title: `B3 teszt csoport ${stamp}`,
    type: 'kezdo',
    course: course.id,
    startDate: start,
    endDate: end,
    signup: { mode: 'open', kind: 'beginner', capacity: 2 },
  } as never,
});
const opts = group.signup?.options ?? [];
const two = opts.find((p) => (p.installments ?? 1) === 2);
const one = opts.find((p) => (p.installments ?? 1) === 1);
const pay = async (token: string) => {
  const order = (await payload.find({ collection: 'orders', where: { token: { equals: token } }, depth: 0 })).docs[0];
  const [p] = (
    await payload.find({ collection: 'payments', where: { order: { equals: order.id } }, depth: 0, sort: '-createdAt' })
  ).docs;
  await payload.update({
    collection: 'mockPayments',
    id: Number(p.providerPaymentId.replace('mock_', '')),
    data: { status: 'paid', paidAt: new Date().toISOString() },
  });
  await applyPaymentUpdate(payload, p.providerPaymentId, 'return');
  await afterPaid(payload, order.id);
  return payload.findByID({ collection: 'orders', id: order.id, depth: 0 });
};
const appOf = async (orderId: number) => {
  const o = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 });
  return payload.findByID({ collection: 'applications', id: Number(o.application), depth: 0 });
};
try {
  ok(
    opts.length === (course.prices ?? []).length && two && one && opts.some((p) => p.installments === 3),
    `a new kezdő group gets the course's prices as options (${opts.map((p) => `${p.label}/${p.installments}`)})`,
  );
  ok(
    dueNow({ amount: 160000, installments: 2 }).amount === 80000 &&
      dueNow({ amount: 180000, installments: 3 }).amount === 60000,
    'first instalment: 80 000 / 60 000',
  );
  await payload.update({ collection: 'courses', id: course.id, data: { openWithoutGroup: true } });
  await payload.update({ collection: 'courseGroups', id: group.id, data: { signup: { payOnline: true } } as never });

  // ── A: the free sign-up is closed while the course takes payment ─────────
  const free = await signUp(payload, null, { kind: 'beginner', courseGroupId: group.id, ...guest('Free') });
  ok(!free.ok && /fizetéssel/.test(free.reason), `free kezdő sign-up refused (${!free.ok && free.reason})`);

  // ── B: a group, two instalments ───────────────────────────────────────────
  const bad = await checkoutCourse(payload, null, { groupId: group.id, optionId: 'nope', ...guest('Bad') });
  ok(!bad.ok && /hogyan fizetsz/.test(bad.reason), 'an unknown option is refused');
  const a = await checkoutCourse(payload, null, { groupId: group.id, optionId: two?.id ?? '', ...guest('Anna') });
  ok(a.ok && a.checkoutUrl?.includes('/fizetes/mock/'), 'checkout → the payment page');
  if (!a.ok) throw new Error(a.reason);
  const orderA = (await payload.find({ collection: 'orders', where: { token: { equals: a.token } }, depth: 0 }))
    .docs[0];
  ok(
    orderA.kind === 'beginner' && orderA.amountDue === 80000 && /1\. részlet a 2-ből/.test(orderA.label),
    `order: 80 000 Ft, "${orderA.label}"`,
  );
  ok((await appOf(orderA.id)).status === 'held', 'the place is held');
  ok((await mail(emails.at(-1) ?? '', 'Jelentkezésed fizetése')) === 1, 'the payment-link e-mail');
  const paidA = await pay(a.token);
  const appA = await appOf(orderA.id);
  const g1 = await payload.findByID({ collection: 'courseGroups', id: group.id, depth: 0 });
  const userA = await payload.findByID({ collection: 'users', id: Number(appA.user), depth: 0 });
  ok(paidA.status === 'paid' && appA.status === 'registered', 'paid → registered');
  ok(relIds(g1.students).includes(userA.id) && !userA.roomBooking, 'admitted: in the group (room booking stays off)');
  ok((await mail(userA.email, 'Felvételt nyertél')) === 1, 'the welcome e-mail');
  const [invA] = (await payload.find({ collection: 'invoices', where: { order: { equals: orderA.id } }, depth: 0 }))
    .docs;
  ok(
    invA?.gross === 80000 && (invA.data as { items: { unit: string }[] }).items[0].unit === 'kurzus',
    'invoice (draft): 80 000 Ft, "kurzus"',
  );
  await afterPaid(payload, orderA.id); // the job retried
  ok(
    relIds((await payload.findByID({ collection: 'courseGroups', id: group.id, depth: 0 })).students).filter(
      (x) => x === userA.id,
    ).length === 1,
    'a retry: still in the group once',
  );
  const viewA = await orderStatus(payload, a.token);
  ok(
    viewA?.againPath?.startsWith(`/fizetes/kurzus/${course.slug}?csoport=`),
    `the order page's "again" link (${viewA?.againPath})`,
  );

  // ── C: capacity 2 — one more fits, then "megtelt" ────────────────────────
  const b = await checkoutCourse(payload, null, { groupId: group.id, optionId: one?.id ?? '', ...guest('Bea') });
  ok(b.ok, 'the second place');
  const c = await checkoutCourse(payload, null, { groupId: group.id, optionId: one?.id ?? '', ...guest('Cili') });
  ok(!c.ok && /megtelt/i.test(c.reason), `third: full (${!c.ok && c.reason})`);

  // ── D: without a group the sign-up stays free (staff place it, with or without payment) ──
  const d = await signUp(payload, null, { kind: 'beginner', courseId: course.id, ...guest('Dora') });
  ok(d.ok, `without a group: the free sign-up (${d.ok ? '' : d.reason})`);
  const staff = (await payload.find({ collection: 'users', where: { roles: { in: ['admin'] } }, limit: 1 }))
    .docs[0] as TypedUser;
  const group2 = await payload.create({
    collection: 'courseGroups',
    data: {
      title: `B3 teszt csoport 2 ${stamp}`,
      type: 'kezdo',
      course: course.id,
      startDate: start,
      endDate: end,
      signup: { mode: 'open', kind: 'beginner', capacity: 5 },
    } as never,
  });
  if (d.ok) {
    const placed = await admit(payload, staff, d.applicationId, group2.id);
    ok(placed.ok, `staff place it (Felvétel), no payment needed (${placed.ok ? '' : placed.reason})`);
  }

  // ── E: staff can still admit without any payment (switch off → free sign-up) ──
  await payload.update({
    collection: 'courseGroups',
    id: group.id,
    data: { signup: { payOnline: false, capacity: 10 } } as never,
  });
  const e = await signUp(payload, null, { kind: 'beginner', courseGroupId: group.id, ...guest('Emma') });
  ok(e.ok, `the group's switch off: the free sign-up works again (${e.ok ? '' : e.reason})`);
  if (e.ok) {
    const ad = await admit(payload, staff, e.applicationId, null);
    ok(ad.ok, 'and staff admit without payment');
  }
  await payload.delete({ collection: 'courseGroups', id: group2.id }).catch(() => {});
  (globalThis as { group2?: number }).group2 = group2.id;
} catch (err) {
  console.error(err);
  failures++;
} finally {
  await payload.update({ collection: 'courses', id: course.id, data: before });
  const users = await payload.find({ collection: 'users', where: { email: { in: emails } }, depth: 0, limit: 50 });
  const ids = users.docs.map((u) => u.id);
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
  const gs = await payload.find({
    collection: 'courseGroups',
    where: { title: { contains: `B3 teszt csoport` } },
    depth: 0,
  });
  for (const g of gs.docs) await payload.delete({ collection: 'courseGroups', id: g.id }).catch(() => {});
  if (ids.length) await payload.delete({ collection: 'users', where: { id: { in: ids } } });
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
