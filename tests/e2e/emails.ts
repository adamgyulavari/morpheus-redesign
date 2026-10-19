// The e-mails from the admin texts (E-mailek): room bookings (confirmed / moved / cancelled by staff),
// a group's session changed, the login link with its code, a placeholder edited in the admin — and
// that the layout's lines come from "Közös". Mailpit; own data, cleaned up.
import config from '@payload-config';
import { getPayload } from 'payload';

import { requestMagicLink } from '@/payload/magic-link';
import { BASE, launch, MAILPIT, OUT } from './env';

const payload = await getPayload({ config });
let failures = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`);
  if (!c) failures++;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stamp = Date.now().toString(36);
const mail = async (to: string, subject: string) => {
  for (let i = 0; i < 25; i++) {
    const r = (await (
      await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}" subject:"${subject}"`)}`)
    ).json()) as { messages: { ID: string }[] };
    if (r.messages[0])
      return ((await (await fetch(`${MAILPIT}/api/v1/message/${r.messages[0].ID}`)).json()) as { Text: string }).Text;
    await sleep(300);
  }
  return '';
};
const user = await payload.create({
  collection: 'users',
  data: {
    email: `e1.${stamp}@example.com`,
    password: `x${stamp}Aa1!`,
    firstName: 'Emese',
    lastName: 'Teszt',
    _verified: true,
  } as never,
});
const before = await payload.findGlobal({ slug: 'emailTexts', depth: 0 });
let staffId = 0;
const created: { collection: 'roomBookings' | 'sessions' | 'courseGroups'; id: number }[] = [];
try {
  const room = (await payload.find({ collection: 'rooms', limit: 1, depth: 0 })).docs[0];
  const at = (days: number, h: number) => {
    const d = new Date(Date.now() + days * 864e5);
    d.setUTCHours(h, 0, 0, 0);
    return d.toISOString();
  };
  // ── room bookings ────────────────────────────────────────────────────────
  const b = await payload.create({
    collection: 'roomBookings',
    data: {
      kind: 'practice',
      status: 'confirmed',
      user: user.id,
      rooms: [room.id],
      start: at(5, 7),
      end: at(5, 8),
    } as never,
    context: { overridePractice: true },
  });
  created.push({ collection: 'roomBookings', id: b.id });
  const conf = await mail(user.email, 'Teremfoglalás visszaigazolása');
  ok(
    conf.includes('Kedves Emese!') && conf.includes('Lefoglaltad a termet') && conf.includes('Foglalásaim'),
    'booking confirmed: greeting, heading, button',
  );
  ok(
    conf.includes('Ha mégsem jössz') &&
      conf.includes('Ha a gomb nem működik') &&
      conf.includes('rendszere küldte automatikusan'),
    'its footnote and the layout lines (Közös)',
  );
  await payload.update({
    collection: 'roomBookings',
    id: b.id,
    data: { start: at(5, 9), end: at(5, 10) } as never,
    context: { overridePractice: true },
  });
  ok(
    (await mail(user.email, 'Teremfoglalás módosítva')).includes('A munkatársaink módosították'),
    'booking moved by staff',
  );
  const admin = (await payload.find({ collection: 'users', where: { roles: { in: ['admin'] } }, limit: 1 })).docs[0];
  await payload.update({
    collection: 'roomBookings',
    id: b.id,
    data: { status: 'cancelled', cancelledBy: admin.id, cancelReason: 'Próba' } as never,
  });
  const cancelled = await mail(user.email, 'Teremfoglalás lemondva');
  ok(
    cancelled.includes('le kellett mondanunk') && cancelled.includes('Próba'),
    'cancelled by staff, with the reason row',
  );

  // ── a session of the person's group changes ──────────────────────────────
  const g = await payload.create({
    collection: 'courseGroups',
    data: {
      title: `E1 csoport ${stamp}`,
      type: 'egyeb',
      startDate: at(-10, 8).slice(0, 10),
      endDate: at(60, 8).slice(0, 10),
      students: [user.id],
    } as never,
  });
  created.push({ collection: 'courseGroups', id: g.id });
  const s = await payload.create({
    collection: 'sessions',
    data: {
      kind: 'course',
      courseGroup: g.id,
      start: at(7, 16),
      end: at(7, 18),
      locationType: 'external',
      externalLocation: 'Valahol',
      status: 'scheduled',
    } as never,
  });
  created.unshift({ collection: 'sessions', id: s.id });
  await payload.update({ collection: 'sessions', id: s.id, data: { start: at(7, 17), end: at(7, 19) } as never });
  const changed = await mail(user.email, `Változás: E1 csoport ${stamp}`);
  ok(
    changed.includes('alkalom ideje') && !changed.includes('{'),
    `session changed: "ideje" filled in (${changed.match(/Változott a\(z\)[^\n]*/)?.[0] ?? ''})`,
  );

  // ── the login link and its code ──────────────────────────────────────────
  await requestMagicLink(payload, user.email, '127.0.0.1');
  const link = await mail(user.email, 'Belépési link');
  ok(
    /\d{3} \d{3}/.test(link) && link.includes('Ha a belépést egy másik eszközön kérted'),
    'login link: the code and its intro',
  );

  // ── edited in the admin: the next e-mail uses it ─────────────────────────
  await payload.updateGlobal({
    slug: 'emailTexts',
    data: { account: { magicLink: { subject: `Belépés ide: {keresztnev} ${stamp}` } } } as never,
  });
  await requestMagicLink(payload, user.email, '127.0.0.2');
  ok(
    (await mail(user.email, `Belépés ide: Emese ${stamp}`)) !== '',
    'an edited subject (with a placeholder) is used right away',
  );

  // ── the admin page (staff) ───────────────────────────────────────────────
  const password = `x${stamp}Aa1!`;
  const staff = await payload.create({
    collection: 'users',
    data: {
      email: `e1.staff.${stamp}@example.com`,
      password,
      firstName: 'Staff',
      lastName: 'Teszt',
      _verified: true,
    } as never,
  });
  staffId = staff.id;
  // a new account is always a student (the Users hook): the role is given afterwards
  await payload.update({ collection: 'users', id: staff.id, data: { roles: ['staff'] } });
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });
    await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.type('input[name=email]', staff.email);
    await page.type('input[name=password]', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }),
      page.keyboard.press('Enter'),
    ]);
    await page.goto(`${BASE}/admin/globals/emailTexts`, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForFunction(() => document.body.innerText.includes('Teremfoglalás'), { timeout: 60000 });
    const t = await page.evaluate(() => document.body.innerText);
    ok(
      ['Jelentkezés', 'Fizetés', 'Teremfoglalás', 'Fiók', 'Közös'].every((tab) => t.includes(tab)),
      'the E-mailek page: its tabs',
    );
    ok(t.includes('{keresztnev}'), 'the placeholders are listed');
    await page.screenshot({ path: `${OUT}/emails-admin.png` });
  } finally {
    await browser.close();
  }
} catch (err) {
  console.error(err);
  failures++;
} finally {
  if (staffId) await payload.delete({ collection: 'users', id: staffId }).catch(() => {});
  await payload.updateGlobal({ slug: 'emailTexts', data: before as never });
  for (const c of created) await payload.delete({ collection: c.collection, id: c.id }).catch(() => {});
  await payload.delete({ collection: 'users', id: user.id }).catch(() => {});
}
console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
