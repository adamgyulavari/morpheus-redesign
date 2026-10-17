import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Kezdő with online payment: the course's switch, the price options' instalment count (backfilled
// from notes like "2 × 80 000 Ft"), and the groups' public code (their checkout link).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "course_groups" ADD COLUMN "code" varchar;
  UPDATE "course_groups"
    SET "code" = translate(substr(encode(decode(md5(random()::text || id::text), 'hex'), 'base64'), 1, 8), '+/', '-_')
    WHERE "code" IS NULL;
  CREATE UNIQUE INDEX "course_groups_code_idx" ON "course_groups" USING btree ("code");
  ALTER TABLE "courses_prices" ADD COLUMN "installments" numeric DEFAULT 1;
  UPDATE "courses_prices" SET "installments" = substring("note" from '^\\s*(\\d+)\\s*[×x]')::numeric
    WHERE "note" ~ '^\\s*\\d+\\s*[×x]';
  ALTER TABLE "courses" ADD COLUMN "pay_online" boolean DEFAULT false;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "course_groups_code_idx";
  ALTER TABLE "course_groups" DROP COLUMN IF EXISTS "code";
  ALTER TABLE "courses_prices" DROP COLUMN IF EXISTS "installments";
  ALTER TABLE "courses" DROP COLUMN IF EXISTS "pay_online";`);
}
