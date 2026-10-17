import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_course_groups_signup_mode" AS ENUM('closed', 'open', 'window');
  ALTER TABLE "course_groups" ADD COLUMN "signup_mode" "enum_course_groups_signup_mode" DEFAULT 'closed' NOT NULL;
  -- from the old checkbox: ticked with a date → in the window, ticked without → open
  UPDATE "course_groups" SET "signup_mode" = CASE
    WHEN NOT "signup_enabled" THEN 'closed'
    WHEN "signup_opens_at" IS NOT NULL OR "signup_closes_at" IS NOT NULL THEN 'window'
    ELSE 'open'
  END::"enum_course_groups_signup_mode"
  WHERE "signup_enabled" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_groups" DROP COLUMN "signup_mode";
  DROP TYPE "public"."enum_course_groups_signup_mode";`)
}
