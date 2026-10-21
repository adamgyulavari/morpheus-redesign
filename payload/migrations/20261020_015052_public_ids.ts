import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// A booking's public link uses a random id, never the sequential one: its tickets
// (/fiokom/jegyek/<uid>). The existing rows are filled.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applications" ADD COLUMN "uid" varchar;
  UPDATE "applications" SET "uid" = gen_random_uuid()::text WHERE "uid" IS NULL;
  CREATE UNIQUE INDEX "applications_uid_idx" ON "applications" USING btree ("uid");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "applications_uid_idx";
  ALTER TABLE "applications" DROP COLUMN "uid";`)
}
