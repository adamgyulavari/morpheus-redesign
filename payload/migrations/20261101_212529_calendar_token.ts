import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The secret of each account's calendar feed (/naptar/<token>); empty until /fiokom first shows it.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "calendar_token" varchar;
  CREATE UNIQUE INDEX "users_calendar_token_idx" ON "users" USING btree ("calendar_token");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "users_calendar_token_idx";
  ALTER TABLE "users" DROP COLUMN "calendar_token";`)
}
