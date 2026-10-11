/**
 * The schema snapshot of the migrations (payload/migrations/<newest migration>.json).
 *
 * `npm run migrate:create` diffs the config against the newest snapshot to write the next
 * migration; running migrations never reads snapshots. So only the newest one is kept:
 *
 *   npm run migrate:snapshot   rebuild it from the current config — after merging branches that
 *                              both added migrations (the newest snapshot then lacks one side's
 *                              changes). Only valid while the config matches the migrations.
 *   --prune                    delete the older snapshots (runs after every migrate:create)
 */
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve('payload/migrations');
const files = readdirSync(dir);
const newestMigration = files
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  .sort()
  .at(-1)
  ?.replace(/\.ts$/, '');
if (!newestMigration) throw new Error(`no migrations in ${dir}`);

const keep = `${newestMigration}.json`;

if (!process.argv.includes('--prune')) {
  // the same snapshot migrate:create writes (Payload's Drizzle schema → drizzle-kit JSON)
  const { getPayload } = await import('payload');
  const { default: config } = await import('@payload-config');
  const payload = await getPayload({ config });
  const db = payload.db as unknown as {
    schema: unknown;
    requireDrizzleKit: () => { generateDrizzleJson: (schema: unknown) => Promise<unknown> };
  };
  const json = (await db.requireDrizzleKit().generateDrizzleJson(db.schema)) as { id?: string };
  // keep the existing snapshot's (random) id, so an unchanged schema leaves the file unchanged
  const target = path.join(dir, keep);
  if (existsSync(target)) json.id = (JSON.parse(readFileSync(target, 'utf8')) as { id?: string }).id ?? json.id;
  writeFileSync(target, JSON.stringify(json, null, 2));
  console.log(`rebuilt ${keep}`);
}

for (const f of files) {
  if (f.endsWith('.json') && f !== keep) {
    rmSync(path.join(dir, f));
    console.log(`removed ${f}`);
  }
}
process.exit(0);
