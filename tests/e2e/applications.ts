// Phase 3A stage 3: server logic + e-mails (Mailpit on :8025). Cleaned up afterwards.
import config from '@payload-config';
import { getPayload, type TypedUser } from 'payload';

import {
  admit,
  allowedActions,
  cancelOwn,
  moveOwn,
  review,
  runWorkshopCutoffs,
  signUp,
  upcomingWorkshops,
} from '@/lib/applications/server';
import { consumeMagicLink } from '@/payload/magic-link';
import { MAILPIT } from './env';

const payload = await getPayload({ config });
// the free (3A) workshop sign-up runs only with online payment switched off
await payload.updateGlobal({ slug: 'billingSettings', data: { onlinePayments: false } });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const stamp = Date.now().toString(36);
const H = 3_600_000;
const made = { users: [] as number[], sessions: [] as number[], groups: [] as number[] };
const staffBox = `a3.staff.${stamp}@example.com`;
const mail = async (to: string, subject?: string) => {
  const q = encodeURIComponent(`to:"${to}"${subject ? ` subject:"${subject}"` : ''}`);
  const { messages } = await (await fetch(`${MAILPIT}/api/v1/search?query=${q}&limit=50`)).json();
  return messages as { ID: string; Subject: string }[];
};
const body = async (id: string) => (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()).HTML as string;
const settle = () => new Promise((r) => setTimeout(r, 400));
const person = (n: string) => ({
  lastName: 'Teszt',
  firstName: n,
  email: `a3.${n.toLowerCase()}.${stamp}@example.com`,
  phone: '+36 30 123 4567',
});
const userByEmail = async (email: string) =>
  (await payload.find({ collection: 'users', where: { email: { equals: email } }, depth: 0, showHiddenFields: true }))
    .docs[0];
const rooms = Object.fromEntries(
  (await payload.find({ collection: 'rooms', depth: 0, limit: 10 })).docs.map((r) => [r.slug, r.id]),
);
const settingsBefore = await payload.findGlobal({ slug: 'applicationSettings', depth: 0 });

const workshop = async (startIn: number, extra: Record<string, unknown> = {}) => {
  const start = new Date(Math.floor((Date.now() + startIn) / H) * H);
  const s = await payload.create({
    collection: 'sessions',
    data: {
      kind: 'workshop',
      start: start.toISOString(),
      end: new Date(start.getTime() + 3 * H).toISOString(),
      locationType: 'unplaced',
      workshop: { price: 6000, minParticipants: 5, maxParticipants: 6 },
      ...extra,
    } as never,
  });
  made.sessions.push(s.id);
  return s;
};

try {
  await payload.updateGlobal({ slug: 'applicationSettings', data: { notifyEmails: [{ email: staffBox }] } });

  // ── a guest signs up ──
  const w1 = await workshop(5 * 24 * H);
  const guest = person('Gabi');
  const before = (await upcomingWorkshops(payload)).find((w) => w.id === w1.id);
  const r1 = await signUp(payload, null, { kind: 'workshop', sessionId: w1.id, ...guest });
  ok(r1.ok, `a guest signs up (${r1.ok || r1.reason})`);
  const gu = await userByEmail(guest.email);
  if (gu) made.users.push(gu.id);
  ok(
    gu?.roles?.includes('student') && gu._verified === false && gu.firstName === 'Gabi',
    'an unverified student account is made',
  );
  await settle();
  const conf = await mail(guest.email, 'Jelentkezés');
  ok(conf.length === 1, 'the guest gets the confirmation');
  const html = conf[0] ? await body(conf[0].ID) : '';
  ok(
    html.includes('Fiókod elkészült') && html.includes('6000 Ft') && html.includes('a helyszínen fizeted'),
    'with "Fiókod elkészült", the price and "paid on site" (E-mailek)',
  );
  const token = html.match(/belepes\/link\?token=([\w-]{43})/)?.[1];
  ok(token && /next=%2Ffiokom["&]/.test(html), 'and a login link to /fiokom');
  ok((await mail(staffBox, 'Új jelentkezés')).length === 1, 'staff are notified');
  const after = (await upcomingWorkshops(payload)).find((w) => w.id === w1.id);
  ok(
    before?.state.state === 'open' &&
      after?.state.state === 'open' &&
      before.state.left === 6 &&
      after.state.left === 5,
    'the places left drop from 6 to 5',
  );
  ok(
    token &&
      (await consumeMagicLink(payload, token)) === gu?.id &&
      (await userByEmail(guest.email))?._verified === true,
    'using the link logs in and verifies the account',
  );

  const again = await signUp(payload, null, { kind: 'workshop', sessionId: w1.id, ...guest });
  ok(
    !again.ok && again.reason === 'Erre az alkalomra már jelentkeztél.',
    `the same person twice is refused (${again.ok || again.reason})`,
  );

  // ── a logged-in user, one click ──
  const lu = person('Lili');
  const lili = (await payload.create({
    collection: 'users',
    data: { ...lu, password: 'jelszo12345', _verified: true } as never,
    disableVerificationEmail: true,
  })) as TypedUser;
  made.users.push(lili.id);
  const r2 = await signUp(payload, lili, {
    kind: 'workshop',
    sessionId: w1.id,
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
  });
  ok(r2.ok, `a logged-in user signs up with nothing typed (${r2.ok || r2.reason})`);
  await settle();
  const liliMail = (await mail(lu.email, 'Jelentkezés'))[0];
  const liliHtml = liliMail ? await body(liliMail.ID) : '';
  ok(
    liliHtml.includes('fiókodban követheted') && !liliHtml.includes('belepes/link'),
    'logged in: no login link, no "Fiókod elkészült"',
  );
  const r2b = await signUp(payload, lili, {
    kind: 'workshop',
    sessionId: w1.id,
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
  });
  ok(!r2b.ok, 'a second sign-up for the same date is refused');

  // ── racing for the last places: 3 people, 4 left → exactly ... fill to 5 then race for the 6th ──
  const p3 = person('Pali');
  await signUp(payload, null, { kind: 'workshop', sessionId: w1.id, ...p3 });
  const p4 = person('Peti');
  await signUp(payload, null, { kind: 'workshop', sessionId: w1.id, ...p4 });
  const p5 = person('Rozi');
  await signUp(payload, null, { kind: 'workshop', sessionId: w1.id, ...p5 }); // 5 of 6
  const [x, y] = [person('Xavi'), person('Yvett')];
  const race = await Promise.all([
    signUp(payload, null, { kind: 'workshop', sessionId: w1.id, ...x }),
    signUp(payload, null, { kind: 'workshop', sessionId: w1.id, ...y }),
  ]);
  for (const p of [p3, p4, p5, x, y]) {
    const u = await userByEmail(p.email);
    if (u) made.users.push(u.id);
  }
  ok(race.filter((r) => r.ok).length === 1, 'two racing for the last place: one succeeds');
  const loser = race.find((r) => !r.ok);
  ok(
    loser && !loser.ok && loser.reason.includes('megtelt'),
    `the other is told "megtelt" (${loser && !loser.ok ? loser.reason : ''})`,
  );
  ok((await upcomingWorkshops(payload)).find((w) => w.id === w1.id)?.state.state === 'full', 'the date shows as full');

  // ── cancel at 25 h works, at 23 h not ──
  const app1 = r1.ok ? r1.applicationId : 0;
  const start1 = new Date(w1.start).getTime();
  const gabi = (await userByEmail(guest.email)) as unknown as TypedUser;
  const late = await cancelOwn(payload, gabi, app1, new Date(start1 - 23 * H));
  ok(!late.ok && late.reason.includes('24 órával'), `23 h before: refused (${late.ok || late.reason})`);
  const lateActions = await allowedActions(
    payload,
    { kind: 'workshop', status: 'registered', session: w1.id },
    { workshopCutoffHours: 48, userCancelHours: 24 },
    new Date(start1 - 23 * H),
  );
  ok(!lateActions.cancel.ok, 'and no cancel button then');
  const inTime = await cancelOwn(payload, gabi, app1, new Date(start1 - 25 * H));
  ok(inTime.ok, '25 h before: cancelled');
  await settle();
  ok((await mail(guest.email, 'Lemondva')).length === 1, 'the participant gets the cancellation');
  const staffCancel = (await mail(staffBox, 'Lemondás'))[0];
  ok(staffCancel && (await body(staffCancel.ID)).includes('5 fő'), 'staff are notified with the new count (5)');
  const otherUser = (await userByEmail(lu.email)) as unknown as TypedUser;
  ok(!(await cancelOwn(payload, otherUser, app1)).ok, "someone else's application can't be cancelled");

  // ── cutoff with 4 → cancelled, booking released, next dates, one-click move ──
  const w2 = await workshop(4 * 24 * H, {
    locationType: 'room',
    rooms: [rooms.probaterem],
    workshop: { price: 6000, minParticipants: 5, maxParticipants: 10 },
  });
  ok(w2.booking, 'the second date has a room booking');
  const four = ['Anna', 'Bori', 'Cili', 'Dori'].map(person);
  const fourApps: number[] = [];
  for (const p of four) {
    const r = await signUp(payload, null, { kind: 'workshop', sessionId: w2.id, ...p });
    if (r.ok) fourApps.push(r.applicationId);
    const u = await userByEmail(p.email);
    if (u) made.users.push(u.id);
  }
  const w3 = await workshop(9 * 24 * H, { workshop: { price: 6000, minParticipants: 5, maxParticipants: 10 } });
  const cut = new Date(new Date(w2.start).getTime() - 47 * H);
  const decided = await runWorkshopCutoffs(payload, cut);
  ok(
    decided.some((d) => d.sessionId === w2.id && d.outcome === 'cancelled'),
    '4 registered: the date is cancelled',
  );
  const w2After = await payload.findByID({ collection: 'sessions', id: w2.id, depth: 0 });
  ok(
    w2After.status === 'cancelled' && w2After.workshop?.workshopStatus === 'cancelled' && !w2After.booking,
    'its room booking is released',
  );
  const fourAfter = await payload.find({ collection: 'applications', where: { id: { in: fourApps } }, depth: 0 });
  ok(
    fourAfter.docs.every((d) => d.status === 'cancelled' && d.cancelReason === 'minimum nem teljesült'),
    'the sign-ups are cancelled: "minimum nem teljesült"',
  );
  await settle();
  const elmarad = (await mail(four[0]?.email, 'Elmarad'))[0];
  const elmaradHtml = elmarad ? await body(elmarad.ID) : '';
  ok(
    elmarad && elmaradHtml.includes('Új időpont') && elmaradHtml.includes('belepes/link'),
    'participants are told, with the next dates and a login link',
  );
  ok(
    (await runWorkshopCutoffs(payload, cut)).every((d) => d.sessionId !== w2.id),
    'the cutoff runs once',
  );
  const anna = (await userByEmail(four[0]?.email)) as unknown as TypedUser;
  const firstApp = fourApps[0] ?? 0;
  const moved = await moveOwn(payload, anna, firstApp, w3.id, cut);
  ok(moved.ok, `one click: moved to another date (${moved.ok || moved.reason})`);
  const old = await payload.findByID({ collection: 'applications', id: firstApp, depth: 0 });
  ok(
    old.status === 'moved' &&
      old.movedTo &&
      moved.ok &&
      (typeof old.movedTo === 'object' ? old.movedTo.id : old.movedTo) === moved.applicationId,
    'the old one is "moved", pointing to the new',
  );

  // ── cutoff with 5 → confirmed ──
  const w4 = await workshop(6 * 24 * H, { workshop: { price: 6000, minParticipants: 5, maxParticipants: 10 } });
  const five = ['Emma', 'Flora', 'Gina', 'Hedi', 'Ica'].map(person);
  for (const p of five) {
    await signUp(payload, null, { kind: 'workshop', sessionId: w4.id, ...p });
    const u = await userByEmail(p.email);
    if (u) made.users.push(u.id);
  }
  const decided5 = await runWorkshopCutoffs(payload, new Date(new Date(w4.start).getTime() - 47 * H));
  ok(
    decided5.some((d) => d.sessionId === w4.id && d.outcome === 'confirmed'),
    '5 registered: confirmed',
  );
  await settle();
  ok((await mail(five[4]?.email, 'Biztosan indul')).length === 1, '"biztosan indul" e-mails');

  // ── beginner: sign up → "Felvétel a kurzusba" → may book rooms ──
  const admin = (await payload.find({ collection: 'users', where: { roles: { in: ['admin'] } }, limit: 1 }))
    .docs[0] as TypedUser;
  const beginner = await payload.create({
    collection: 'courseGroups',
    data: {
      title: `TESZT kezdő ${stamp}`,
      type: 'kezdo',
      startDate: new Date(Date.now() + 20 * 24 * H).toISOString(),
      endDate: new Date(Date.now() + 120 * 24 * H).toISOString(),
      signup: { mode: 'open', capacity: 12, price: 45000, priceLabel: '45 000 Ft / hó' },
    },
  });
  made.groups.push(beginner.id);
  ok(beginner.signup?.kind === 'beginner', 'a kezdő group takes beginner sign-ups by default');
  const bp = person('Bea');
  const rb = await signUp(payload, null, { kind: 'beginner', courseGroupId: beginner.id, ...bp });
  const bea = await userByEmail(bp.email);
  if (bea) made.users.push(bea.id);
  ok(rb.ok && !bea?.roomBooking, 'a beginner signs up (no room booking yet)');
  const ad = rb.ok ? await admit(payload, admin, rb.applicationId) : { ok: false };
  const beaAfter = await userByEmail(bp.email);
  const gAfter = await payload.findByID({ collection: 'courseGroups', id: beginner.id, depth: 0 });
  ok(
    ad.ok &&
      !beaAfter?.roomBooking &&
      (gAfter.students ?? []).map((s) => (typeof s === 'object' ? s.id : s)).includes(bea?.id),
    '"Felvétel a kurzusba": in the group (room booking stays off)',
  );
  await settle();
  ok((await mail(bp.email, 'Felvételt nyertél')).length === 1, 'with a welcome e-mail');

  // ── professional: application → interview → accepted; another → rejected, no e-mail ──
  const pro = await payload.create({
    collection: 'courseGroups',
    data: {
      title: `TESZT szakmai ${stamp}`,
      type: 'szakmai',
      startDate: new Date(Date.now() + 30 * 24 * H).toISOString(),
      endDate: new Date(Date.now() + 300 * 24 * H).toISOString(),
      signup: { mode: 'open' },
    },
  });
  made.groups.push(pro.id);
  const motivation =
    'Tíz éve járok színházba, két évig amatőr társulatban játszottam, és szeretnék komolyabban, szakmai közegben fejlődni.';
  const short = await signUp(payload, null, {
    kind: 'professional',
    courseGroupId: pro.id,
    ...person('Rovid'),
    message: 'kevés',
  });
  ok(!short.ok && short.reason.includes('100'), 'a short motivation is refused');
  const pp = person('Panna');
  const rp = await signUp(payload, null, { kind: 'professional', courseGroupId: pro.id, ...pp, message: motivation });
  const panna = await userByEmail(pp.email);
  if (panna) made.users.push(panna.id);
  ok(rp.ok, 'a professional application is sent');
  await settle();
  const staffPro = (await mail(staffBox, 'Panna'))[0];
  ok(staffPro && (await body(staffPro.ID)).includes('szakmai közegben'), 'staff get it with the motivation');
  ok((await mail(pp.email, 'Megkaptuk')).length === 1, 'the applicant gets "megkaptuk"');
  ok(rp.ok && (await review(payload, rp.applicationId, 'interview')).ok, '→ interview');
  ok(rp.ok && (await admit(payload, admin, rp.applicationId)).ok, '→ accepted');
  const pAfter = rp.ok ? await payload.findByID({ collection: 'applications', id: rp.applicationId, depth: 0 }) : null;
  ok(pAfter?.status === 'accepted', 'status accepted');
  await settle();
  ok((await mail(pp.email, 'Felvételt nyertél')).length === 1, 'welcome e-mail with a login link');
  const rp2 = await signUp(payload, null, {
    kind: 'professional',
    courseGroupId: pro.id,
    ...person('Rita'),
    message: motivation,
  });
  const rita = await userByEmail(person('Rita').email);
  if (rita) made.users.push(rita.id);
  const beforeReject = (await mail(person('Rita').email)).length;
  ok(rp2.ok && (await review(payload, rp2.applicationId, 'rejected')).ok, 'another one is rejected');
  await settle();
  ok((await mail(person('Rita').email)).length === beforeReject, 'rejection sends nothing');
  for (const u of [admin]) void u;
  const short2 = await userByEmail(person('Rövid').email);
  if (short2) made.users.push(short2.id);
} catch (e) {
  console.error(e);
  failures++;
} finally {
  await payload.updateGlobal({
    slug: 'applicationSettings',
    data: { notifyEmails: settingsBefore.notifyEmails ?? [] },
  });
  const ids = [...new Set(made.users)];
  const apps = await payload.find({
    collection: 'applications',
    where: { user: { in: ids } },
    depth: 0,
    limit: 0,
    pagination: false,
  });
  for (const a of apps.docs)
    await payload.update({ collection: 'applications', id: a.id, data: { movedTo: null } }).catch(() => {});
  for (const a of apps.docs) await payload.delete({ collection: 'applications', id: a.id }).catch(() => {});
  for (const id of made.sessions) await payload.delete({ collection: 'sessions', id }).catch(() => {});
  for (const id of made.groups) await payload.delete({ collection: 'courseGroups', id }).catch(() => {});
  for (const id of ids) await payload.delete({ collection: 'users', id }).catch(() => {});
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
await payload.updateGlobal({ slug: 'billingSettings', data: { onlinePayments: true } });
process.exit(failures ? 1 : 0);
