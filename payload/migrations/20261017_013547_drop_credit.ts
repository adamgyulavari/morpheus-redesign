import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// No credit system: the order's `credit_used` and the `credited` / `refunded` sign-up statuses go.
// The status type is rebuilt, so the partial unique indexes that filter on it are rebuilt around it.
const DROP_INDEXES = sql`
  DROP INDEX IF EXISTS "applications_one_active_per_session";
  DROP INDEX IF EXISTS "applications_one_active_per_course_group";
  DROP INDEX IF EXISTS "applications_one_open_without_group";`;
const CREATE_INDEXES = sql`
  CREATE UNIQUE INDEX "applications_one_active_per_session" ON "applications" ("user_id", "session_id")
    WHERE "session_id" IS NOT NULL AND "status" IN ('held', 'registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_active_per_course_group" ON "applications" ("user_id", "course_group_id")
    WHERE "course_group_id" IS NOT NULL AND "status" IN ('held', 'registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_open_without_group" ON "applications" ("user_id", "kind", COALESCE("course_id", 0))
    WHERE "kind" <> 'workshop' AND "course_group_id" IS NULL AND "status" IN ('held', 'registered', 'new', 'interview');`;

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(DROP_INDEXES);
  await db.execute(sql`
  ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE text;
  UPDATE "applications" SET "status" = 'cancelled' WHERE "status" IN ('credited', 'refunded');
  DROP TYPE "public"."enum_applications_status";
  CREATE TYPE "public"."enum_applications_status" AS ENUM('held', 'registered', 'cancelled', 'moved', 'new', 'interview', 'accepted', 'rejected', 'withdrawn');
  ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."enum_applications_status" USING "status"::"public"."enum_applications_status";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "credit_used";`);
  await db.execute(CREATE_INDEXES);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(DROP_INDEXES);
  await db.execute(sql`
  ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE text;
  DROP TYPE "public"."enum_applications_status";
  CREATE TYPE "public"."enum_applications_status" AS ENUM('held', 'registered', 'cancelled', 'moved', 'credited', 'refunded', 'new', 'interview', 'accepted', 'rejected', 'withdrawn');
  ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."enum_applications_status" USING "status"::"public"."enum_applications_status";
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "credit_used" numeric DEFAULT 0 NOT NULL;`);
  await db.execute(CREATE_INDEXES);
}
