import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// A Nyitott Műhely date's public code: its checkout link (/fizetes?alkalom=…) instead of the
// sequential id. New dates get one in the Sessions hook; the existing ones here (8 url-safe chars).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "sessions" ADD COLUMN "code" varchar;
  UPDATE "sessions"
    SET "code" = translate(substr(encode(decode(md5(random()::text || id::text), 'hex'), 'base64'), 1, 8), '+/', '-_')
    WHERE "kind" = 'workshop' AND "code" IS NULL;
  CREATE UNIQUE INDEX "sessions_code_idx" ON "sessions" USING btree ("code");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "sessions_code_idx";
  ALTER TABLE "sessions" DROP COLUMN IF EXISTS "code";`);
}
