import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// A course group of type Társulat (the company): its start and end dates are optional (without an
// end it stays active; the other types still need both).

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_course_groups_type" ADD VALUE 'tarsulat' BEFORE 'egyeb';
  ALTER TABLE "course_groups" ALTER COLUMN "start_date" DROP NOT NULL;
  ALTER TABLE "course_groups" ALTER COLUMN "end_date" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "course_groups" SET "type" = 'egyeb' WHERE "type" = 'tarsulat';
  UPDATE "course_groups" SET "start_date" = coalesce("start_date", "end_date", now()), "end_date" = coalesce("end_date", "start_date", now())
    WHERE "start_date" IS NULL OR "end_date" IS NULL;
  ALTER TABLE "course_groups" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_course_groups_type";
  CREATE TYPE "public"."enum_course_groups_type" AS ENUM('kezdo', 'szakmai', 'egyeb');
  ALTER TABLE "course_groups" ALTER COLUMN "type" SET DATA TYPE "public"."enum_course_groups_type" USING "type"::"public"."enum_course_groups_type";
  ALTER TABLE "course_groups" ALTER COLUMN "start_date" SET NOT NULL;
  ALTER TABLE "course_groups" ALTER COLUMN "end_date" SET NOT NULL;`)
}
