// Phase 3B stage 1: workshop checkout with the mock provider, the webhook, lapsed holds, late payment,
// the race for the last place, amount mismatch. Against the dev server (webhook over HTTP) and
// Mailpit. Own test date; everything is cleaned up.
import config from '@payload-config';
import { getPayload, type TypedUser } from 'payload';

import { NOBODY, takenBy, upcomingWorkshops } from '@/lib/applications/server';
import { applyPaymentUpdate, cancelOrder, checkout, orderStatus, retryPayment } from '@/lib/payments/service';
import { BASE, MAILPIT } from './env';

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
  const email = `b1.${first.toLowerCase()}.${stamp}@example.com`;
  emails.push(email);
  return { lastName: 'Teszt', firstName: first, email, phone: '+36301234567', billing };
};
const webhook = (body: string) =>
  fetch(`${BASE}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
const mockId = (providerPaymentId: string) => Number(providerPaymentId.replace('mock_', ''));
const setMock = (providerPaymentId: string, data: Record<string, unknown>) =>
  payload.update({ collection: 'mockPayments', id: mockId(providerPaymentId), data });
const paymentsOf = async (orderId: number) =>
  (await payload.find({ collection: 'payments', where: { order: { equals: orderId } }, sort: 'createdAt', depth: 0 }))
    .docs;
const orderOf = (token: string) =>
  payload.find({ collection: 'orders', where: { token: { equals: token } }, depth: 0 }).then((r) => r.docs[0]);
const appOf = async (orderId: number) => {
  const o = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 });
  return payload.findByID({ collection: 'applications', id: Number(o.application), depth: 0 });
};
const mail = async (to: string, subject: string) => {
  for (let i = 0; i < 20; i++) {
    const r = (await (
      await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}" subject:"${subject}"`)}`)
    ).json()) as {
      messages: { ID: string; Attachments: number }[];
    };
    if (r.messages.length) return r.messages;
    await sleep(500);
  }
  return [];
};

const start = new Date(Date.now() + 10 * 864e5);
const session = await payload.create({
  collection: 'sessions',
  data: {
    kind: 'workshop',
    title: `B1 teszt ${stamp}`,
    start: start.toISOString(),
    end: new Date(start.getTime() + 2 * 3_600_000).toISOString(),
    locationType: 'unplaced',
    status: 'scheduled',
    workshop: { price: 5000, minParticipants: 2, maxParticipants: 3, bookable: true, workshopStatus: 'open' },
  },
});
const places = async () => (await takenBy(payload, 'session_id', [session.id])).get(session.id) ?? NOBODY;
const setMax = (max: number) =>
  payload.update({ collection: 'sessions', id: session.id, data: { workshop: { maxParticipants: max } } });

try {
  // ── A: checkout holds a place ─────────────────────────────────────────────
  const a = await checkout(payload, null, { sessionId: session.id, ...guest('Anna') });
  ok(a.ok && a.checkoutUrl?.includes('/fizetes/mock/mock_'), 'checkout: to the mock payment page');
  const orderA = a.ok ? await orderOf(a.token) : undefined;
  const appA = orderA ? await appOf(orderA.id) : undefined;
  ok(
    orderA?.status === 'pending' && orderA.amountDue === 5000 && orderA.billing?.zip === '1027',
    'order pending, 5000 Ft, billing saved',
  );
  ok(
    appA?.status === 'held' && appA.holdUntil && new Date(appA.holdUntil) > new Date(),
    'application held until the hold ends',
  );
  ok((await mail(emails[0] ?? '', 'Jelentkezésed fizetése')).length === 1, 'e-mail: the payment link (a backup)');
  let t = await places();
  ok(t.taken === 1 && t.paid === 0, `a held place is taken, not paid (${t.taken}/${t.paid})`);
  const pubLeft = (await upcomingWorkshops(payload)).find((w) => w.id === session.id)?.state;
  ok(pubLeft && 'left' in pubLeft && pubLeft.left === 2, 'the public page shows 2 places left');

  // ── B: the webhook trusts nobody ──────────────────────────────────────────
  ok((await webhook('id=mock_99999999')).status === 200, 'unknown id: 200');
  ok((await webhook('nonsense=1')).status === 200, 'malformed: 200');
  const [payA] = orderA ? await paymentsOf(orderA.id) : [];
  await webhook(`id=${payA?.providerPaymentId}&status=paid&amount=5000`);
  ok(
    (await orderOf(a.ok ? a.token : ''))?.status === 'pending',
    "the body's claims are ignored (the provider still says pending)",
  );

  // ── C: paid; the same webhook 5× at once has one effect ───────────────────
  await setMock(payA?.providerPaymentId ?? '', { status: 'paid', paidAt: new Date().toISOString() });
  const responses = await Promise.all([1, 2, 3, 4, 5].map(() => webhook(`id=${payA?.providerPaymentId}`)));
  ok(
    responses.every((r) => r.status === 200),
    'five webhooks: all 200',
  );
  const paidA = a.ok ? await orderOf(a.token) : undefined;
  ok(paidA?.status === 'paid' && paidA.paidAt, 'order paid');
  ok((await appOf(paidA?.id ?? 0)).status === 'registered', 'application registered');
  const jobs = await payload.find({
    collection: 'payload-jobs',
    where: { and: [{ taskSlug: { equals: 'orderPaid' } }, { 'input.orderId': { equals: paidA?.id } }] },
  });
  ok(jobs.totalDocs === 1, `one follow-up job (${jobs.totalDocs})`);
  t = await places();
  ok(t.taken === 1 && t.paid === 1, 'now paid');

  // ── D: the e-mails (the job runs) ─────────────────────────────────────────
  await payload.jobs.run({ queue: 'payments' });
  const conf = await mail(emails[0] ?? '', 'Sikeres fizetés');
  ok(conf.length === 1 && conf[0]?.Attachments === 1, 'confirmation to the participant, with the .ics');
  ok((await mail('info@morpheus-szinmuhely.hu', `Új fizetett jelentkezés: Teszt Anna`)).length >= 1, 'staff notice');

  // ── E: failed → "Újrapróbálom" on the same order ──────────────────────────
  const b = await checkout(payload, null, { sessionId: session.id, ...guest('Bea') });
  const orderB = b.ok ? await orderOf(b.token) : undefined;
  const [payB1] = orderB ? await paymentsOf(orderB.id) : [];
  await setMock(payB1?.providerPaymentId ?? '', { status: 'failed' });
  await webhook(`id=${payB1?.providerPaymentId}`);
  const viewB = b.ok ? await orderStatus(payload, b.token) : null;
  ok(
    viewB?.status === 'pending' && viewB.lastFailed,
    'failed: the order still holds the place, "Újrapróbálom" offered',
  );
  const retry = b.ok ? await retryPayment(payload, b.token) : null;
  ok(retry?.ok && retry.checkoutUrl, 'retry: a new payment');
  const [, payB2] = orderB ? await paymentsOf(orderB.id) : [];
  await setMock(payB2?.providerPaymentId ?? '', { status: 'paid', paidAt: new Date().toISOString() });
  await webhook(`id=${payB2?.providerPaymentId}`);
  ok((await orderOf(b.ok ? b.token : ''))?.status === 'paid', 'the retry paid the same order');

  // ── F: a lapsed hold frees the place (by its date; nothing runs) ──────────
  const c = await checkout(payload, null, { sessionId: session.id, ...guest('Cili') });
  const orderC = c.ok ? await orderOf(c.token) : undefined;
  ok((await places()).taken === 3, 'three places taken (one held)');
  const full = await checkout(payload, null, { sessionId: session.id, ...guest('Dora') });
  ok(!full.ok && /megtelt/i.test(full.reason), `full while the hold lasts (${!full.ok && full.reason})`);
  const past = new Date(Date.now() - 60_000).toISOString();
  await payload.update({ collection: 'orders', id: orderC?.id ?? 0, data: { expiresAt: past } });
  await payload.update({
    collection: 'applications',
    id: (await appOf(orderC?.id ?? 0)).id,
    data: { holdUntil: past },
  });
  ok((await places()).taken === 2, 'a lapsed hold no longer takes the place');
  const viewC = c.ok ? await orderStatus(payload, c.token) : null;
  ok(viewC?.status === 'pending' && viewC.lapsed, 'the order page: unpaid, lapsed (pay if a place is free)');

  // ── G: late payment, the place still free: accepted ───────────────────────
  const [payC] = orderC ? await paymentsOf(orderC.id) : [];
  await setMock(payC?.providerPaymentId ?? '', { status: 'paid', paidAt: new Date().toISOString() });
  await webhook(`id=${payC?.providerPaymentId}`);
  ok(
    (await orderOf(c.ok ? c.token : ''))?.status === 'paid' && (await appOf(orderC?.id ?? 0)).status === 'registered',
    'late payment, place free: accepted',
  );

  // ── H: late payment, the place taken meanwhile: refunded ──────────────────
  await setMax(4);
  const d = await checkout(payload, null, { sessionId: session.id, ...guest('Dora') });
  const orderD = d.ok ? await orderOf(d.token) : undefined;
  await payload.update({ collection: 'orders', id: orderD?.id ?? 0, data: { expiresAt: past } });
  await payload.update({
    collection: 'applications',
    id: (await appOf(orderD?.id ?? 0)).id,
    data: { holdUntil: past },
  });
  const e = await checkout(payload, null, { sessionId: session.id, ...guest('Emma') });
  ok(e.ok, 'someone else takes the freed place');
  const payLater = d.ok ? await retryPayment(payload, d.token) : null;
  ok(
    payLater && !payLater.ok && /megtelt/i.test(payLater.reason),
    `the e-mailed link, place taken: "megtelt" (${payLater && !payLater.ok ? payLater.reason : ''})`,
  );
  const [payD] = orderD ? await paymentsOf(orderD.id) : [];
  await setMock(payD?.providerPaymentId ?? '', { status: 'paid', paidAt: new Date().toISOString() });
  await webhook(`id=${payD?.providerPaymentId}`);
  await sleep(500);
  const mockD = await payload.findByID({ collection: 'mockPayments', id: mockId(payD?.providerPaymentId ?? '') });
  ok(mockD.amountRefunded === 5000, 'late payment, place taken: refunded in full');
  ok(
    (await orderOf(d.ok ? d.token : ''))?.status === 'refunded' &&
      (await appOf(orderD?.id ?? 0)).status === 'cancelled',
    'order refunded, application stays cancelled',
  );
  ok((await mail(emails[3] ?? '', 'Visszautaltuk')).length === 1, 'e-mail to the person');
  ok((await mail('info@morpheus-szinmuhely.hu', 'automatikus visszatérítés')).length >= 1, 'staff alert');

  // ── I: two buyers race for the last place ─────────────────────────────────
  t = await places();
  await setMax(t.taken + 1);
  const race = await Promise.all([
    checkout(payload, null, { sessionId: session.id, ...guest('Flora') }),
    checkout(payload, null, { sessionId: session.id, ...guest('Greta') }),
  ]);
  const won = race.filter((r) => r.ok).length;
  const lost = race.find((r) => !r.ok);
  ok(
    won === 1 && lost && !lost.ok && /megtelt/i.test(lost.reason),
    `race: one gets checkout, the other "Megtelt" (${lost && !lost.ok ? lost.reason : ''})`,
  );

  // ── J: amount mismatch ────────────────────────────────────────────────────
  await setMax(20);
  const h = await checkout(payload, null, { sessionId: session.id, ...guest('Hanna') });
  const orderH = h.ok ? await orderOf(h.token) : undefined;
  const [payH] = orderH ? await paymentsOf(orderH.id) : [];
  await setMock(payH?.providerPaymentId ?? '', { status: 'paid', amount: 4000, paidAt: new Date().toISOString() });
  await webhook(`id=${payH?.providerPaymentId}`);
  ok((await orderOf(h.ok ? h.token : ''))?.status === 'pending', 'amount mismatch: not confirmed');
  ok((await mail('info@morpheus-szinmuhely.hu', 'eltérő fizetett összeg')).length >= 1, 'staff alerted');

  // ── J2: the e-mailed link after the hold ran out, a place free: the place again, a new payment ──
  const m = await checkout(payload, null, { sessionId: session.id, ...guest('Mira') });
  const orderM = m.ok ? await orderOf(m.token) : undefined;
  await payload.update({ collection: 'orders', id: orderM?.id ?? 0, data: { expiresAt: past } });
  await payload.update({
    collection: 'applications',
    id: (await appOf(orderM?.id ?? 0)).id,
    data: { holdUntil: past },
  });
  const takenBefore = (await places()).taken;
  const resumed = await checkout(payload, null, { sessionId: session.id, ...guest('Mira') });
  ok(resumed.ok && m.ok && resumed.token === m.token, 'signing up again for the date: the same order');
  const appM = await appOf(orderM?.id ?? 0);
  ok(
    appM.status === 'held' && new Date(appM.holdUntil ?? 0) > new Date() && (await places()).taken === takenBefore + 1,
    'the place is held again',
  );
  ok(orderM && (await paymentsOf(orderM.id)).length === 2, 'a new payment for it');

  // ── K: "Mégse" ────────────────────────────────────────────────────────────
  const k = await checkout(payload, null, { sessionId: session.id, ...guest('Kata') });
  const cancelled = k.ok ? await cancelOrder(payload, k.token) : null;
  const orderK = k.ok ? await orderOf(k.token) : undefined;
  ok(
    cancelled?.ok && orderK?.status === 'canceled' && (await appOf(orderK.id)).status === 'cancelled',
    '"Mégse": order canceled, place let go',
  );

  // ── L: billing validation, the duplicate hold ─────────────────────────────
  const bad = await checkout(payload, null, {
    sessionId: session.id,
    ...guest('Lili'),
    billing: { ...billing, zip: '12' },
  });
  ok(!bad.ok && /irányítószám/i.test(bad.reason), 'a bad zip is refused');
  const accented = await checkout(payload, null, { sessionId: session.id, ...guest('Dóra') });
  ok(
    !accented.ok && /e-mail/i.test(accented.reason),
    `an address Payload would refuse: a message, not a crash (${!accented.ok && accented.reason})`,
  );
  const viewer = (await payload.find({ collection: 'users', where: { email: { equals: emails[0] } } }))
    .docs[0] as TypedUser;
  const m1 = await checkout(payload, viewer, { sessionId: session.id, ...guest('Anna'), email: '' });
  ok(
    !m1.ok && /már jelentkeztél/i.test(m1.reason),
    `already registered for the date: refused (${!m1.ok && m1.reason})`,
  );
  const again = await applyPaymentUpdate(payload, payA?.providerPaymentId ?? '', 'test');
  ok(again === 'unchanged', 'a repeated update: unchanged');
} catch (err) {
  console.error(err);
  failures++;
} finally {
  const users = await payload.find({
    collection: 'users',
    where: { email: { in: emails } },
    limit: 0,
    pagination: false,
  });
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
    if (p.providerPaymentId.startsWith('mock_'))
      await payload.db
        .deleteOne({ collection: 'mockPayments', where: { id: { equals: mockId(p.providerPaymentId) } } })
        .catch(() => {});
    await payload.db.deleteOne({ collection: 'payments', where: { id: { equals: p.id } } });
  }
  await payload.update({
    collection: 'applications',
    where: { user: { in: ids } },
    data: { order: null, movedTo: null },
  });
  await payload.db.deleteMany({ collection: 'invoices', where: { order: { in: orders.docs.map((o) => o.id) } } });
  for (const o of orders.docs) await payload.db.deleteOne({ collection: 'orders', where: { id: { equals: o.id } } });
  await payload.delete({ collection: 'applications', where: { user: { in: ids } } });
  await payload.delete({ collection: 'sessions', id: session.id });
  await payload.delete({ collection: 'users', where: { id: { in: ids } } });
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
