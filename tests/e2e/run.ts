/**
 * Runs the end-to-end suites (README.md here), each in its own process, and sums up:
 *   npm run test:e2e                     all of them
 *   npm run test:e2e -- emails kezdo     the ones named
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { BASE, MAILPIT } from './env';

/** In order; `mock`: the dev server must run with PAYMENT_PROVIDER=mock (the webhook goes to it). */
const SUITES: { name: string; about: string; mock?: boolean }[] = [
  { name: 'applications', about: 'jelentkezés, lemondás, áthelyezés, döntés az indulásról, e-mailek' },
  { name: 'dashboard', about: 'Jelentkezések oldal: fizetés rögzítése, felvétel, döntések' },
  { name: 'payment-switch', about: 'az „Online fizetés” kapcsoló' },
  { name: 'payments', about: 'Nyitott Műhely fizetés: webhook, foglalás, késői fizetés, verseny', mock: true },
  { name: 'checkout-ui', about: 'a fizetés böngészőben, a kiküldött linkkel', mock: true },
  { name: 'kezdo', about: 'kezdő fizetéssel: csoport, részlet, felvétel' },
  { name: 'invoicing', about: 'számlák (kikapcsolt módban), sztornó, módok' },
  { name: 'account', about: 'Számláim, PDF jogosultság, számlázási adatok, visszatérítés' },
  { name: 'monthly-billing', about: 'Havi számlázás: havidíj, részletek, befizetve' },
  { name: 'emails', about: 'az E-mailek szövegei: terem, alkalom, belépés, szerkesztés' },
  { name: 'security', about: 'ki mit lát és mit írhat az API-n; a mock éles oldalon; titkok' },
];

const wanted = process.argv.slice(2);
const unknown = wanted.filter((w) => !SUITES.some((s) => s.name === w));
if (unknown.length) {
  console.error(`Unknown suite: ${unknown.join(', ')}. Suites: ${SUITES.map((s) => s.name).join(', ')}`);
  process.exit(2);
}
const run = wanted.length ? SUITES.filter((s) => wanted.includes(s.name)) : SUITES;

const reachable = async (url: string) => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(5000) })).ok;
  } catch {
    return false;
  }
};
if (!(await reachable(BASE))) {
  console.error(`The dev server isn't reachable at ${BASE} (npm run dev).`);
  process.exit(2);
}
if (!(await reachable(`${MAILPIT}/api/v1/info`))) {
  console.error(`Mailpit isn't reachable at ${MAILPIT} (docker-compose.dev.yml).`);
  process.exit(2);
}

const here = path.dirname(new URL(import.meta.url).pathname);
const results: { name: string; ok: boolean; mock?: boolean }[] = [];
for (const s of run) {
  console.log(`\n── ${s.name}: ${s.about}`);
  const r = spawnSync(
    'npx',
    ['tsx', '--env-file=.env', '--tsconfig', path.join(here, 'tsconfig.json'), path.join(here, `${s.name}.ts`)],
    {
      stdio: ['ignore', 'pipe', 'inherit'],
      encoding: 'utf8',
      // payments in-process with the mock; invoices as drafts (a suite may switch to the test account)
      env: { ...process.env, PAYMENT_PROVIDER: 'mock', INVOICING_MODE: 'off', NODE_OPTIONS: '--no-deprecation' },
      timeout: 10 * 60_000,
    },
  );
  const lines = (r.stdout ?? '').split('\n').filter((l) => /^(PASS|FAIL)\b|passed|FAILED/.test(l));
  console.log(lines.join('\n'));
  results.push({ name: s.name, ok: r.status === 0, mock: s.mock });
}

console.log('\n── összesen');
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
const failed = results.filter((r) => !r.ok);
if (failed.some((r) => r.mock))
  console.log('\nA fizetési tesztekhez a dev szervert PAYMENT_PROVIDER=mock beállítással kell futtatni.');
process.exit(failed.length ? 1 : 0);
