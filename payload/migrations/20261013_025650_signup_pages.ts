import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_courses_signup_mode" AS ENUM('external', 'beginner', 'professional');
  ALTER TABLE "courses" ADD COLUMN "signup_mode" "enum_courses_signup_mode" DEFAULT 'external' NOT NULL;
  ALTER TABLE "ui" ADD COLUMN "sessions_needed" varchar NOT NULL DEFAULT 'Még {count} jelentkező kell az induláshoz';
  ALTER TABLE "ui" ALTER COLUMN "sessions_needed" DROP DEFAULT;
  ALTER TABLE "ui" ADD COLUMN "sessions_confirmed" varchar NOT NULL DEFAULT 'Biztosan indul';
  ALTER TABLE "ui" ALTER COLUMN "sessions_confirmed" DROP DEFAULT;
  ALTER TABLE "ui" ADD COLUMN "sessions_full" varchar NOT NULL DEFAULT 'Megtelt';
  ALTER TABLE "ui" ALTER COLUMN "sessions_full" DROP DEFAULT;
  ALTER TABLE "ui" ADD COLUMN "sessions_left" varchar NOT NULL DEFAULT '{count} szabad hely';
  ALTER TABLE "ui" ALTER COLUMN "sessions_left" DROP DEFAULT;`)

  // the courses sign up on the site now (lib/applications); the button says so
  await db.execute(sql`
  UPDATE "courses" SET "signup_mode" = 'beginner' WHERE "slug" = 'kezdo-kurzus';
  UPDATE "courses" SET "signup_mode" = 'professional' WHERE "slug" = 'szakmai-kurzus';
  UPDATE "ui" SET "sessions_book" = 'Jelentkezem' WHERE "sessions_book" = 'Foglalok';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses" DROP COLUMN "signup_mode";
  ALTER TABLE "ui" DROP COLUMN "sessions_needed";
  ALTER TABLE "ui" DROP COLUMN "sessions_confirmed";
  ALTER TABLE "ui" DROP COLUMN "sessions_full";
  ALTER TABLE "ui" DROP COLUMN "sessions_left";
  DROP TYPE "public"."enum_courses_signup_mode";`)
}
