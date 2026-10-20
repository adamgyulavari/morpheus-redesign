/**
 * npm run import:groups -- <file.json> [--email] [--room=Nagyterem] [--dry-run]
 *
 * Course groups and their members from a JSON file ({ groups: [{ name, weekday, startTime,
 * members: [{ name, email }] }] }) — see lib/applications/group-import.ts for what becomes what.
 * Safe to run again: groups by name, members by e-mail (only added, never removed).
 *
 *   --email     the newly added members get the "Felvétel a kurzusba" e-mail (a login link;
 *               not for an ended group); without it nobody hears about it
 *   --room=…    the weekly slot's room(s), by name, comma-separated (default: Nagyterem)
 *   --dry-run   only says what it would do
 */
import { readFileSync } from 'node:fs';

import config from '@payload-config';
import { getPayload } from 'payload';

import { type ImportFile, importGroups, planGroups } from '@/lib/applications/group-import';
import { todayInBudapest } from '@/lib/dates';

const args = process.argv.slice(2);
const file = args.find((a) => a.endsWith('.json'));
if (!file) {
  console.error('Usage: npm run import:groups -- <file.json> [--email] [--room=Nagyterem] [--dry-run]');
  process.exit(1);
}
const email = args.includes('--email');
const dryRun = args.includes('--dry-run');
const roomNames = (args.find((a) => a.startsWith('--room='))?.slice(7) ?? 'Nagyterem').split(',').map((s) => s.trim());

const payload = await getPayload({ config });
const { docs: rooms } = await payload.find({
  collection: 'rooms',
  where: { name: { in: roomNames } },
  depth: 0,
  limit: 0,
});
if (rooms.length !== roomNames.length) {
  console.error(`No such room: ${roomNames.filter((n) => !rooms.some((r) => r.name === n)).join(', ')}`);
  process.exit(1);
}

const plan = planGroups(JSON.parse(readFileSync(file, 'utf8')) as ImportFile, todayInBudapest());
const r = await importGroups(payload, plan, { roomIds: rooms.map((x) => x.id), email, dryRun });

console.log(dryRun ? 'Dry run — nothing was saved.\n' : '');
for (const [i, g] of r.groups.entries()) {
  const p = plan[i];
  const slot = p?.schedule ? `${p.schedule.weekday}. nap ${p.schedule.startTime}–${p.schedule.endTime}` : 'no slot';
  const dates = p?.startDate ? `${p.startDate} – ${p.endDate}` : 'no dates';
  console.log(
    `${g.created ? 'new    ' : 'updated'}  ${g.title} (${p?.type}, ${dates}, ${slot}): +${g.added}, ${g.members} members`,
  );
}
console.log(`\nAccounts created: ${r.accountsCreated}. E-mails sent: ${r.emailsSent}${email ? '' : ' (no --email)'}.`);
process.exit(0);
