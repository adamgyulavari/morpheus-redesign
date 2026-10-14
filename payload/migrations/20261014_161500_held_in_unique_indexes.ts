import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// The one-application-per-person guards count `held` too (lib/applications/rules.ts ACTIVE_STATUSES):
// someone paying for a date can't hold it twice. Separate from 20261014_161157_payments, because a
// new enum value can't be used in the transaction that adds it.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "applications_one_active_per_session";
  DROP INDEX IF EXISTS "applications_one_active_per_course_group";
  DROP INDEX IF EXISTS "applications_one_open_without_group";
  CREATE UNIQUE INDEX "applications_one_active_per_session" ON "applications" ("user_id", "session_id")
    WHERE "session_id" IS NOT NULL AND "status" IN ('held', 'registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_active_per_course_group" ON "applications" ("user_id", "course_group_id")
    WHERE "course_group_id" IS NOT NULL AND "status" IN ('held', 'registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_open_without_group" ON "applications" ("user_id", "kind", COALESCE("course_id", 0))
    WHERE "kind" <> 'workshop' AND "course_group_id" IS NULL AND "status" IN ('held', 'registered', 'new', 'interview');`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "applications_one_active_per_session";
  DROP INDEX IF EXISTS "applications_one_active_per_course_group";
  DROP INDEX IF EXISTS "applications_one_open_without_group";
  CREATE UNIQUE INDEX "applications_one_active_per_session" ON "applications" ("user_id", "session_id")
    WHERE "session_id" IS NOT NULL AND "status" IN ('registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_active_per_course_group" ON "applications" ("user_id", "course_group_id")
    WHERE "course_group_id" IS NOT NULL AND "status" IN ('registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_open_without_group" ON "applications" ("user_id", "kind", COALESCE("course_id", 0))
    WHERE "kind" <> 'workshop' AND "course_group_id" IS NULL AND "status" IN ('registered', 'new', 'interview');`);
}
