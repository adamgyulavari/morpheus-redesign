import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_groups" DROP COLUMN "signup_enabled";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_groups" ADD COLUMN "signup_enabled" boolean DEFAULT false;
  UPDATE "course_groups" SET "signup_enabled" = "signup_mode" <> 'closed';`)
}
