import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "login_tokens" ADD COLUMN "code_hash" varchar;
  ALTER TABLE "login_tokens" ADD COLUMN "attempts" numeric DEFAULT 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "login_tokens" DROP COLUMN "code_hash";
  ALTER TABLE "login_tokens" DROP COLUMN "attempts";`)
}
