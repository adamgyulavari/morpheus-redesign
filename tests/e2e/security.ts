// The payment and invoicing data through the real HTTP API (/api/…), as nobody, as a student and as
// another student: who reads orders, payments, invoices, the mock's records and the settings; that a
// student can't give themselves room booking or a role, edit an invoice or make an order; the mock
// refused on a deployed site; no secret stored. Own accounts (generated passwords); cleaned up.
import { randomBytes } from 'node:crypto';
import config from '@payload-config';
import { sql } from '@payloadcms/db-postgres';
import { getPayload } from 'payload';

import { mockAllowed, paymentProvider } from '@/lib/payments/providers';

import { BASE } from './env';

const payload = await getPayload({ config });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const stamp = Date.now().toString(36);
const password = randomBytes(12).toString('base64url');
const users: number[] = [];
const orders: number[] = [];
const mkStudent = async (who: string) => {
  const u = await payload.create({
    collection: 'users',
    data: {
      email: `sec.${who}.${stamp}@example.com`,
      password,
      firstName: who,
      lastName: 'Teszt',
      _verified: true,
    } as never,
  });
  users.push(u.id);
  const o = await payload.create({
    collection: 'orders',
    data: {
      user: u.id,
      kind: 'workshop',
      label: `Biztonsági teszt ${who}`,
      price: 5000,
      amountDue: 5000,
      status: 'paid',
      paidAt: new Date().toISOString(),
      token: randomBytes(24).toString('base64url'),
    },
  });
  orders.push(o.id);
  await payload.create({
    collection: 'payments',
    data: {
      order: o.id,
      provider: 'mock',
      providerPaymentId: `mock_sec_${who}_${stamp}`,
      amount: 5000,
      status: 'paid',
    },
  });
  const inv = await payload.create({
    collection: 'invoices',
    data: {
      key: `sec-${who}-${stamp}`,
      kind: 'invoice',
      status: 'draft',
      mode: 'off',
      order: o.id,
      user: u.id,
      net: 5000,
      vat: 0,
      gross: 5000,
    },
  });
  return { user: u, order: o, invoice: inv };
};
const login = async (email: string) => {
  const r = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return ((await r.json()) as { token: string }).token;
};
const api = (token: string | null, path: string, init: RequestInit = {}) =>
  fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `JWT ${token}` } : {}),
      ...init.headers,
    },
  });
const docsOf = async (r: Response) =>
  r.ok ? ((await r.json()) as { docs: { id: number; user?: unknown }[] }).docs : null;

try {
  const a = await mkStudent('anna');
  const b = await mkStudent('bela');
  const tokenA = await login(a.user.email);
  ok(Boolean(tokenA), 'a student logs in through the API');

  // ── nobody logged in ─────────────────────────────────────────────────────
  for (const path of [
    '/orders',
    '/payments',
    '/invoices',
    '/mockPayments',
    '/globals/billingSettings',
    '/globals/emailTexts',
  ]) {
    const r = await api(null, path);
    const docs = r.ok ? await docsOf(r) : null;
    ok(!r.ok || (docs !== null && docs.length === 0), `logged out: ${path} → ${r.status}`);
  }

  // ── a student ────────────────────────────────────────────────────────────
  const own = await docsOf(await api(tokenA, '/orders?limit=100&depth=0'));
  ok(own && own.length > 0 && own.every((o) => o.user === a.user.id), `orders: only their own (${own?.length})`);
  ok(!(await api(tokenA, `/orders/${b.order.id}`)).ok, "someone else's order: refused");
  const invoices = await docsOf(await api(tokenA, '/invoices?limit=100&depth=0'));
  ok(
    invoices?.every((i) => i.user === a.user.id) && invoices.some((i) => i.id === a.invoice.id),
    'invoices: only their own',
  );
  ok(!(await api(tokenA, `/invoices/${b.invoice.id}`)).ok, "someone else's invoice: refused");
  ok(!(await api(tokenA, '/payments')).ok, 'payments: staff only');
  ok(!(await api(tokenA, '/mockPayments')).ok, "the mock's records: not for students");
  ok(!(await api(tokenA, '/globals/billingSettings')).ok, 'payment settings: staff only');
  ok(!(await api(tokenA, '/globals/emailTexts')).ok, 'e-mail texts: staff only');

  // writing
  const editInvoice = await api(tokenA, `/invoices/${a.invoice.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ paidAt: new Date().toISOString(), gross: 1 }),
  });
  ok(!editInvoice.ok, `their own invoice can't be edited (${editInvoice.status})`);
  const makeOrder = await api(tokenA, '/orders', {
    method: 'POST',
    body: JSON.stringify({
      user: a.user.id,
      kind: 'workshop',
      label: 'x',
      price: 1,
      amountDue: 1,
      status: 'paid',
      token: 'x'.repeat(30),
    }),
  });
  ok(!makeOrder.ok, `an order can't be made through the API (${makeOrder.status})`);
  const editOrder = await api(tokenA, `/orders/${a.order.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'pending' }),
  });
  ok(!editOrder.ok, `their own order can't be edited (${editOrder.status})`);
  await api(tokenA, `/users/${a.user.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ roomBooking: true, roles: ['admin'], billing: { name: 'Saját Név' } }),
  });
  const after = await payload.findByID({ collection: 'users', id: a.user.id, depth: 0 });
  ok(!after.roomBooking && !(after.roles ?? []).includes('admin'), 'room booking and roles: not by themselves');
  ok(after.billing?.name === 'Saját Név', 'their own billing details: yes');

  // ── the mock on a deployed site; secrets ─────────────────────────────────
  const env = process.env as Record<string, string | undefined>;
  const saved = {
    NODE_ENV: env.NODE_ENV,
    NEXT_PUBLIC_SERVER_URL: env.NEXT_PUBLIC_SERVER_URL,
    PAYMENT_PROVIDER: env.PAYMENT_PROVIDER,
  };
  Object.assign(env, {
    NODE_ENV: 'production',
    NEXT_PUBLIC_SERVER_URL: 'https://morpheus-szinmuhely.hu',
    PAYMENT_PROVIDER: 'mock',
  });
  let refused = '';
  try {
    paymentProvider();
  } catch (err) {
    refused = (err as Error).message;
  }
  ok(!mockAllowed() && /not available in production/.test(refused), 'the mock provider is refused on a deployed site');
  Object.assign(env, saved);
  const db = payload.db.drizzle;
  for (const [name, value] of [
    ['MOLLIE_API_KEY', process.env.MOLLIE_API_KEY],
    ['SZAMLAZZ_AGENT_KEY', process.env.SZAMLAZZ_AGENT_KEY],
  ] as const) {
    if (!value) continue;
    const like = `%${value}%`;
    // whole rows as text: anywhere in a payment, an invoice, an order, a job or its log
    const { rows } = await db.execute(sql`
      SELECT (SELECT count(*) FROM payments t WHERE t::text LIKE ${like})
           + (SELECT count(*) FROM invoices t WHERE t::text LIKE ${like})
           + (SELECT count(*) FROM orders t WHERE t::text LIKE ${like})
           + (SELECT count(*) FROM payload_jobs t WHERE t::text LIKE ${like})
           + (SELECT count(*) FROM payload_jobs_log t WHERE t::text LIKE ${like}) AS n`);
    ok(Number(rows[0]?.n) === 0, `${name}: not stored in the database`);
  }
} catch (err) {
  console.error(err);
  failures++;
} finally {
  await payload.db.deleteMany({ collection: 'invoices', where: { user: { in: users } } });
  await payload.db.deleteMany({ collection: 'payments', where: { order: { in: orders } } });
  await payload.db.deleteMany({ collection: 'orders', where: { id: { in: orders } } });
  await payload.delete({ collection: 'users', where: { id: { in: users } } });
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
