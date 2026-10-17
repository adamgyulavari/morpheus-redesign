import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses" ADD COLUMN "open_without_group" boolean DEFAULT false;
  ALTER TABLE "applications" ADD COLUMN "course_id" integer;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "applications_course_idx" ON "applications" USING btree ("course_id");`)

  // the course of every course application: from its group; a group-less szakmai one gets the
  // szakmai course when there is exactly one
  await db.execute(sql`
  UPDATE "applications" a SET "course_id" = g."course_id"
    FROM "course_groups" g WHERE a."course_group_id" = g."id" AND a."course_id" IS NULL;
  UPDATE "applications" SET "course_id" = (SELECT "id" FROM "courses" WHERE "signup_mode" = 'professional')
    WHERE "kind" = 'professional' AND "course_group_id" IS NULL AND "course_id" IS NULL
      AND (SELECT count(*) FROM "courses" WHERE "signup_mode" = 'professional') = 1;
  -- szakmai applications were always open without a group: keep it so
  UPDATE "courses" SET "open_without_group" = true WHERE "signup_mode" = 'professional';`)

  // one open group-less application per person, kind and course (was: per person, szakmai only)
  await db.execute(sql`
  DROP INDEX IF EXISTS "applications_one_open_professional";
  CREATE UNIQUE INDEX "applications_one_open_without_group" ON "applications" ("user_id", "kind", COALESCE("course_id", 0))
    WHERE "kind" <> 'workshop' AND "course_group_id" IS NULL AND "status" IN ('registered', 'new', 'interview');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "applications_one_open_without_group";
  CREATE UNIQUE INDEX "applications_one_open_professional" ON "applications" ("user_id")
    WHERE "kind" = 'professional' AND "course_group_id" IS NULL AND "status" IN ('new', 'interview');`)
  await db.execute(sql`
   ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_course_id_courses_id_fk";
  
  DROP INDEX IF EXISTS "applications_course_idx";
  ALTER TABLE "courses" DROP COLUMN "open_without_group";
  ALTER TABLE "applications" DROP COLUMN "course_id";`)
}
