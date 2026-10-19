// Phase 3A stage 6: the admin dashboard (/admin/jelentkezesek) in a real browser. Cleaned up afterwards.
import { readFileSync } from 'node:fs';

import config from '@payload-config';
import { getPayload, type TypedUser } from 'payload';

import { signUp, upcomingWorkshops } from '@/lib/applications/server';
import { BASE, launch, OUT } from './env';

const env = Object.fromEntries(
  readFileSync('/Users/adam/dev/morpheus-redesign/.env', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const payload = await getPayload({ config });
// the free (3A) workshop sign-up runs only with online payment switched off
await payload.updateGlobal({ slug: 'billingSettings', data: { onlinePayments: false } });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stamp = Date.now().toString(36);
const T = { timeout: 120000 };
const made = { users: [] as number[], groups: [] as number[] };
const mk = async (first: string) => {
  const u = (await payload.create({
    collection: 'users',
    data: {
      email: `a6.${first.toLowerCase()}.${stamp}@example.com`,
      password: 'jelszo12345',
      lastName: 'Teszt',
      firstName: first,
      phone: '+36301234567',
      _verified: true,
    } as never,
    disableVerificationEmail: true,
  })) as TypedUser;
  made.users.push(u.id);
  return u;
};
const blank = { lastName: '', firstName: '', email: '', phone: '' };
const browser = await launch();
try {
  const [w1] = (await upcomingWorkshops(payload)).filter((w) => w.state.state === 'open');
  const kezdo = (
    await payload.find({
      collection: 'courseGroups',
      where: { 'signup.mode': { in: ['open', 'window'] }, type: { equals: 'kezdo' } },
      depth: 0,
      sort: 'startDate',
    })
  ).docs[0];
  const pro = await payload.create({
    collection: 'courseGroups',
    data: {
      title: `TESZT szakmai ${stamp}`,
      type: 'szakmai',
      startDate: new Date(Date.now() + 30 * 864e5).toISOString(),
      endDate: new Date(Date.now() + 300 * 864e5).toISOString(),
    } as never,
  });
  made.groups.push(pro.id);
  if (!w1 || !kezdo) throw new Error('need an open workshop date and a kezdő group');
  const [wanda, kata, peti, rozi] = [await mk('Wanda'), await mk('Kata'), await mk('Peti'), await mk('Rozi')];
  const rw = await signUp(payload, wanda, { kind: 'workshop', sessionId: w1.id, ...blank });
  const rk = await signUp(payload, kata, { kind: 'beginner', courseGroupId: kezdo.id, ...blank });
  const rr = await signUp(payload, rozi, { kind: 'beginner', courseGroupId: kezdo.id, ...blank });
  const rp = await signUp(payload, peti, {
    kind: 'professional',
    courseId: (
      await payload.find({ collection: 'courses', where: { signupMode: { equals: 'professional' } }, limit: 1 })
    ).docs[0]?.id,
    ...blank,
    message:
      'Gyerekkorom óta színházazom, három évig amatőr társulat tagja voltam; most szakmai képzésben szeretnék fejlődni.',
  });
  ok(rw.ok && rk.ok && rr.ok && rp.ok, 'a workshop sign-up, a kezdő sign-up and a szakmai application');

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  const errors: string[] = [];
  page.on('pageerror', (e: unknown) => errors.push(String(e)));
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'load', ...T });
  await page.waitForSelector('input[name=email]', T);
  await page.type('input[name=email]', env.ADMIN_EMAIL);
  await page.type('input[name=password]', env.ADMIN_PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: 'load', ...T }), page.click('button[type=submit]')]);
  ok(
    await page.evaluate(() =>
      [...document.querySelectorAll('nav a')].some(
        (a) => a.getAttribute('title')?.startsWith('Döntésre vár') && /^\d+$/.test(a.textContent ?? ''),
      ),
    ),
    'the nav shows the "Döntésre vár" badge',
  );
  await page.goto(`${BASE}/admin/jelentkezesek`, { waitUntil: 'load', ...T });
  await page.waitForFunction(() => document.body.innerText.includes('Kezdő kurzus ('), T);
  const t = await page.evaluate(() => document.body.innerText);
  ok(
    t.includes('Teszt Kata') && t.includes('Teszt Peti') && t.includes('Teszt Wanda'),
    'all three are on the dashboard',
  );
  await page.screenshot({ path: `${OUT}/a6-dashboard.png`, fullPage: true });

  const settle = async () => {
    await sleep(500);
    await page.waitForFunction(() => !document.querySelector('button:disabled[class*="btn"]'), T).catch(() => {});
    await sleep(1200);
  };
  /** "Kezelés" on the row (or panel) of a name: opens the dialog. */
  const manage = async (name: string) => {
    await page.evaluate((n: string) => {
      const scope = [...document.querySelectorAll('tr, [class*="panel"]')]
        .filter((r) => r.textContent?.includes(n))
        .at(-1);
      (
        [...(scope?.querySelectorAll('button') ?? [])].find((b) => b.textContent?.trim() === 'Kezelés') as
          | HTMLElement
          | undefined
      )?.click();
    }, name);
    await page.waitForSelector('dialog[open]', T);
    await sleep(300);
  };
  const inDialog = (label: string) =>
    page.evaluate((l: string) => {
      const b = [...document.querySelectorAll('dialog[open] button')].find((x) =>
        x.textContent?.trim().startsWith(l),
      ) as HTMLElement | undefined;
      b?.click();
      return Boolean(b);
    }, label);
  const tick = () =>
    page.evaluate(() =>
      (document.querySelector('dialog[open] input[type=checkbox]') as HTMLInputElement | null)?.click(),
    );
  const typeNote = async (text: string) => {
    await page.click('dialog[open] input[placeholder^="pl. átutalta"]');
    await page.keyboard.type(text);
  };
  const closed = () => page.waitForFunction(() => !document.querySelector('dialog[open]'), T);

  // workshop: record the payment, with a note, one "Mentés"
  await manage('Teszt Wanda');
  await tick();
  await typeNote('átutalta 10.12.');
  await inDialog('Mentés');
  await closed();
  await settle();
  const wAfter = rw.ok ? await payload.findByID({ collection: 'applications', id: rw.applicationId }) : null;
  ok(
    wAfter?.paidOffline === true && wAfter.paymentNote === 'átutalta 10.12.',
    'workshop: paid, with the note, saved together',
  );
  await page.screenshot({ path: `${OUT}/a6-dialog.png` });

  // kezdő: tick "Fizetve" and "Mentés és felvétel" in the same dialog (the case that raced before)
  await manage('Teszt Kata');
  await tick();
  await inDialog('Mentés és felvétel');
  await sleep(200);
  await page.screenshot({ path: `${OUT}/a6-confirm.png` });
  await inDialog('Biztosan felveszed');
  await closed();
  await settle();
  const g = await payload.findByID({ collection: 'courseGroups', id: kezdo.id, depth: 0 });
  const kataAfter = await payload.findByID({ collection: 'users', id: kata.id, depth: 0 });
  const kataApp = rk.ok ? await payload.findByID({ collection: 'applications', id: rk.applicationId }) : null;
  ok(kataApp?.paidOffline === true, 'kezdő: paid');
  ok(
    (g.students ?? []).map((x) => (typeof x === 'object' ? x.id : x)).includes(kata.id),
    'and admitted: Kata is in the group',
  );
  ok(!kataAfter.roomBooking, 'room booking is not given by admission');

  // kezdő: reject (archive)
  await manage('Teszt Rozi');
  await inDialog('Elutasítás');
  await sleep(200);
  await inDialog('Biztosan elutasítod');
  await closed();
  await settle();
  const roziApp = rr.ok ? await payload.findByID({ collection: 'applications', id: rr.applicationId }) : null;
  ok(roziApp?.status === 'cancelled', 'kezdő: rejected → archived');

  // szakmai: interview, then admit into the group
  await manage('Teszt Peti');
  await inDialog('Interjú');
  await closed();
  await settle();
  ok(
    rp.ok && (await payload.findByID({ collection: 'applications', id: rp.applicationId })).status === 'interview',
    '"Interjú"',
  );
  await manage('Teszt Peti');
  await page.evaluate((title: string) => {
    const select = document.querySelector('dialog[open] select') as HTMLSelectElement | null;
    const option = [...(select?.options ?? [])].find((o) => o.text === title);
    if (select && option) {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(select, option.value);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, pro.title);
  await sleep(300);
  await inDialog('Felvétel és csoportba helyezés');
  await sleep(200);
  await inDialog('Biztosan felveszed ebbe');
  await closed();
  await settle();
  const pAfter = rp.ok ? await payload.findByID({ collection: 'applications', id: rp.applicationId, depth: 0 }) : null;
  const proAfter = await payload.findByID({ collection: 'courseGroups', id: pro.id, depth: 0 });
  ok(
    pAfter?.status === 'accepted' &&
      (typeof pAfter.courseGroup === 'object' ? pAfter.courseGroup?.id : pAfter.courseGroup) === pro.id,
    'szakmai: accepted, placed in the group',
  );
  ok(
    (proAfter.students ?? []).map((x) => (typeof x === 'object' ? x.id : x)).includes(peti.id),
    'Peti is in the group',
  );
  const t2 = await page.evaluate(() => document.body.innerText);
  ok(
    !t2.includes('Teszt Kata') && !t2.includes('Teszt Peti') && !t2.includes('Teszt Rozi'),
    'all three decided leave the dashboard',
  );
  await page.screenshot({ path: `${OUT}/a6-after.png`, fullPage: true });
  ok(errors.length === 0, `no page errors (${errors.join(' | ')})`);
} catch (e) {
  console.error(e);
  failures++;
} finally {
  await browser.close();
  const apps = await payload.find({
    collection: 'applications',
    where: { user: { in: made.users } },
    depth: 0,
    limit: 0,
    pagination: false,
  });
  for (const a of apps.docs) await payload.delete({ collection: 'applications', id: a.id }).catch(() => {});
  const groups = await payload.find({ collection: 'courseGroups', depth: 0, limit: 0, pagination: false });
  for (const g of groups.docs) {
    const students = (g.students ?? []).map((x) => (typeof x === 'object' ? x.id : x));
    if (students.some((id) => made.users.includes(id)))
      await payload.update({
        collection: 'courseGroups',
        id: g.id,
        data: { students: students.filter((id) => !made.users.includes(id)) },
      });
  }
  for (const id of made.groups) await payload.delete({ collection: 'courseGroups', id }).catch(() => {});
  for (const id of made.users) await payload.delete({ collection: 'users', id }).catch(() => {});
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
await payload.updateGlobal({ slug: 'billingSettings', data: { onlinePayments: true } });
process.exit(failures ? 1 : 0);
