// The "Online fizetés" switch: off → free sign-up (3A), checkout refused, public page shows the dialog;
// on → the opposite. Own date; cleaned up; the switch is left on.
import config from '@payload-config';
import { getPayload } from 'payload';

import { signUp } from '@/lib/applications/server';
import { checkout } from '@/lib/payments/service';
import { BASE } from './env';

const payload = await getPayload({ config });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const stamp = Date.now().toString(36);
const emails = [`sw.a.${stamp}@example.com`, `sw.b.${stamp}@example.com`];
const person = (email: string) => ({ lastName: 'Teszt', firstName: 'Kapcsolo', email, phone: '+36301234567' });
const billing = {
  name: 'Teszt Elek',
  zip: '1027',
  city: 'Budapest',
  address: 'Frankel Leó út 1.',
  country: 'HU',
  taxNumber: '',
};
const setOnline = (on: boolean) => payload.updateGlobal({ slug: 'billingSettings', data: { onlinePayments: on } });
const start = new Date(Date.now() + 9 * 864e5);
start.setUTCHours(13, 0, 0, 0);
const s = await payload.create({
  collection: 'sessions',
  data: {
    kind: 'workshop',
    title: `Kapcsoló teszt ${stamp}`,
    start: start.toISOString(),
    end: new Date(start.getTime() + 2 * 3_600_000).toISOString(),
    locationType: 'unplaced',
    status: 'scheduled',
    workshop: { price: 5000, minParticipants: 2, maxParticipants: 10, bookable: true, workshopStatus: 'open' },
  },
});
const html = async (path: string) => (await fetch(`${BASE}${path}`)).text();
try {
  await setOnline(false);
  const free = await signUp(payload, null, { kind: 'workshop', sessionId: s.id, ...person(emails[0]) });
  ok(free.ok, `off: the free sign-up works (${free.ok ? '' : free.reason})`);
  if (free.ok) {
    const a = await payload.findByID({ collection: 'applications', id: free.applicationId, depth: 0 });
    ok(a.status === 'registered' && !a.order, `off: registered straight away, no order (${a.status})`);
  }
  const co = await checkout(payload, null, { sessionId: s.id, ...person(emails[1]), billing });
  ok(!co.ok && co.reason.includes('szünetel'), `off: checkout refused (${co.ok ? 'ok' : co.reason})`);
  const page = await html('/nyitott-alkalmak/');
  ok(!page.includes(`/fizetes?alkalom=${s.code}`), 'off: the public page has no checkout link for the date');
  ok((await html(`/fizetes?alkalom=${s.code}`)).includes('szünetel'), 'off: /fizetes says payment is paused');

  await setOnline(true);
  const refused = await signUp(payload, null, { kind: 'workshop', sessionId: s.id, ...person(emails[1]) });
  ok(!refused.ok, `on: the free workshop sign-up is refused (${refused.ok ? 'ok' : refused.reason})`);
  ok(
    (await html('/nyitott-alkalmak/')).includes(`/fizetes?alkalom=${s.code}`),
    'on: the public page links to the checkout',
  );
  ok(!(await html(`/fizetes?alkalom=${s.code}`)).includes('szünetel'), 'on: /fizetes shows the form');
} catch (e) {
  console.error(e);
  failures++;
} finally {
  await setOnline(true);
  const users = await payload.find({ collection: 'users', where: { email: { in: emails } }, depth: 0 });
  const ids = users.docs.map((u) => u.id);
  await payload.delete({ collection: 'applications', where: { session: { equals: s.id } } });
  await payload.delete({ collection: 'sessions', id: s.id });
  if (ids.length) await payload.delete({ collection: 'users', where: { id: { in: ids } } });
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
