/**
 * The schema snapshot of the migrations (payload/migrations/<newest migration>.json), local only
 * (gitignored): `npm run migrate:create` diffs the config against the newest snapshot to write the
 * next migration; running migrations never reads it. Only the newest one is kept:
 *
 *   npm run migrate:snapshot   rebuild it from the current config — on a fresh clone, or after
 *                              merging branches that both added migrations. Only valid while the
 *                              config matches the migrations (no uncommitted model changes).
 *   --check                    before migrate:create: none yet → rebuilt, if the models are as
 *                              committed; otherwise stops with what to do
 *   --prune                    delete the older snapshots (after every migrate:create)
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve('payload/migrations');
const files = readdirSync(dir);
const newestMigration = files
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  .sort()
  .at(-1)
  ?.replace(/\.ts$/, '');
if (!newestMigration) throw new Error(`no migrations in ${dir}`);

if (process.argv.includes('--check')) {
  if (files.some((f) => f.endsWith('.json'))) process.exit(0);
  try {
    // the models as committed (the snapshots themselves don't count)
    execSync(`git diff --quiet HEAD -- payload payload.config.ts ':(exclude)payload/migrations/*.json'`, {
      stdio: 'inherit',
    });
  } catch {
    console.error(
      'No schema snapshot yet, and the models have uncommitted changes. Stash them, run `npm run migrate:snapshot`, unstash, then migrate:create again.',
    );
    process.exit(1);
  }
  execSync('npm run migrate:snapshot', { stdio: 'inherit' });
  process.exit(0);
}

// prune keeps the newest snapshot there is (the one migrate:create reads — a hand-written migration
// has none); a rebuild writes the newest migration's
const rebuild = !process.argv.includes('--prune');
const keep = rebuild
  ? `${newestMigration}.json`
  : files
      .filter((f) => f.endsWith('.json'))
      .sort()
      .at(-1);

if (rebuild) {
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
  const target = path.join(dir, `${newestMigration}.json`);
  const previous = files
    .filter((f) => f.endsWith('.json'))
    .sort()
    .at(-1);
  if (previous) json.id = (JSON.parse(readFileSync(path.join(dir, previous), 'utf8')) as { id?: string }).id ?? json.id;
  writeFileSync(target, JSON.stringify(json, null, 2));
  console.log(`rebuilt ${path.basename(target)}`);
}

for (const f of files) {
  if (f.endsWith('.json') && f !== keep) {
    rmSync(path.join(dir, f));
    console.log(`removed ${f}`);
  }
}
process.exit(0);
