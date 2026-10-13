import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_course_groups_signup_kind" AS ENUM('beginner', 'professional');
  CREATE TYPE "public"."enum_applications_kind" AS ENUM('workshop', 'beginner', 'professional');
  CREATE TYPE "public"."enum_applications_status" AS ENUM('registered', 'cancelled', 'moved', 'new', 'interview', 'accepted', 'rejected', 'withdrawn');
  CREATE TYPE "public"."enum_sessions_workshop_workshop_status" AS ENUM('open', 'confirmed', 'cancelled');
  ALTER TYPE "public"."enum_sessions_kind" ADD VALUE 'workshop' BEFORE 'other';
  CREATE TABLE "applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_title" varchar,
  	"kind" "enum_applications_kind" NOT NULL,
  	"status" "enum_applications_status",
  	"user_id" integer NOT NULL,
  	"session_id" integer,
  	"course_group_id" integer,
  	"target" varchar,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"message" varchar,
  	"moved_to_id" integer,
  	"cancel_reason" varchar,
  	"cancelled_at" timestamp(3) with time zone,
  	"paid_offline" boolean DEFAULT false,
  	"payment_note" varchar,
  	"staff_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "application_settings_notify_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE "application_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"workshop_cutoff_hours" numeric DEFAULT 48 NOT NULL,
  	"user_cancel_hours" numeric DEFAULT 24 NOT NULL,
  	"texts_signup_received" varchar,
  	"texts_application_received" varchar,
  	"texts_confirmed" varchar,
  	"texts_cancelled_minimum" varchar,
  	"texts_cancellation" varchar,
  	"texts_accepted" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "course_groups" ADD COLUMN "signup_enabled" boolean DEFAULT false;
  ALTER TABLE "course_groups" ADD COLUMN "signup_kind" "enum_course_groups_signup_kind";
  ALTER TABLE "course_groups" ADD COLUMN "signup_price" numeric;
  ALTER TABLE "course_groups" ADD COLUMN "signup_price_label" varchar;
  ALTER TABLE "course_groups" ADD COLUMN "signup_capacity" numeric;
  ALTER TABLE "course_groups" ADD COLUMN "signup_opens_at" timestamp(3) with time zone;
  ALTER TABLE "course_groups" ADD COLUMN "signup_closes_at" timestamp(3) with time zone;
  ALTER TABLE "sessions" ADD COLUMN "workshop_price" numeric;
  ALTER TABLE "sessions" ADD COLUMN "workshop_min_participants" numeric DEFAULT 5;
  ALTER TABLE "sessions" ADD COLUMN "workshop_max_participants" numeric DEFAULT 16;
  ALTER TABLE "sessions" ADD COLUMN "workshop_bookable" boolean DEFAULT true;
  ALTER TABLE "sessions" ADD COLUMN "workshop_workshop_status" "enum_sessions_workshop_workshop_status" DEFAULT 'open';
  ALTER TABLE "sessions" ADD COLUMN "workshop_description" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "applications_id" integer;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_course_group_id_course_groups_id_fk" FOREIGN KEY ("course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_moved_to_id_applications_id_fk" FOREIGN KEY ("moved_to_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "application_settings_notify_emails" ADD CONSTRAINT "application_settings_notify_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."application_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "applications_kind_idx" ON "applications" USING btree ("kind");
  CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");
  CREATE INDEX "applications_user_idx" ON "applications" USING btree ("user_id");
  CREATE INDEX "applications_session_idx" ON "applications" USING btree ("session_id");
  CREATE INDEX "applications_course_group_idx" ON "applications" USING btree ("course_group_id");
  CREATE INDEX "applications_moved_to_idx" ON "applications" USING btree ("moved_to_id");
  CREATE INDEX "applications_updated_at_idx" ON "applications" USING btree ("updated_at");
  CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at");
  CREATE INDEX "application_settings_notify_emails_order_idx" ON "application_settings_notify_emails" USING btree ("_order");
  CREATE INDEX "application_settings_notify_emails_parent_id_idx" ON "application_settings_notify_emails" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_applications_fk" FOREIGN KEY ("applications_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "course_groups_signup_signup_opens_at_idx" ON "course_groups" USING btree ("signup_opens_at");
  CREATE INDEX "course_groups_signup_signup_closes_at_idx" ON "course_groups" USING btree ("signup_closes_at");
  CREATE INDEX "sessions_workshop_workshop_workshop_status_idx" ON "sessions" USING btree ("workshop_workshop_status");
  CREATE INDEX "payload_locked_documents_rels_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("applications_id");`)

  // The database guard (lib/applications/rules.ts ACTIVE_STATUSES): one active application per
  // person and date, per person and course, and one open professional application without a course.
  await db.execute(sql`
  CREATE UNIQUE INDEX "applications_one_active_per_session" ON "applications" ("user_id", "session_id")
    WHERE "session_id" IS NOT NULL AND "status" IN ('registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_active_per_course_group" ON "applications" ("user_id", "course_group_id")
    WHERE "course_group_id" IS NOT NULL AND "status" IN ('registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_open_professional" ON "applications" ("user_id")
    WHERE "kind" = 'professional' AND "course_group_id" IS NULL AND "status" IN ('new', 'interview');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "application_settings_notify_emails" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "application_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "applications" CASCADE;
  DROP TABLE "application_settings_notify_emails" CASCADE;
  DROP TABLE "application_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_applications_fk";
  DELETE FROM "room_bookings" WHERE "session_id" IN (SELECT "id" FROM "sessions" WHERE "kind" = 'workshop');
  DELETE FROM "sessions" WHERE "kind" = 'workshop';
  ALTER TABLE "sessions" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "sessions" ALTER COLUMN "kind" SET DEFAULT 'course'::text;
  DROP TYPE "public"."enum_sessions_kind";
  CREATE TYPE "public"."enum_sessions_kind" AS ENUM('course', 'rehearsal', 'exam', 'show', 'other');
  ALTER TABLE "sessions" ALTER COLUMN "kind" SET DEFAULT 'course'::"public"."enum_sessions_kind";
  ALTER TABLE "sessions" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_sessions_kind" USING "kind"::"public"."enum_sessions_kind";
  DROP INDEX "course_groups_signup_signup_opens_at_idx";
  DROP INDEX "course_groups_signup_signup_closes_at_idx";
  DROP INDEX "sessions_workshop_workshop_workshop_status_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_applications_id_idx";
  ALTER TABLE "course_groups" DROP COLUMN "signup_enabled";
  ALTER TABLE "course_groups" DROP COLUMN "signup_kind";
  ALTER TABLE "course_groups" DROP COLUMN "signup_price";
  ALTER TABLE "course_groups" DROP COLUMN "signup_price_label";
  ALTER TABLE "course_groups" DROP COLUMN "signup_capacity";
  ALTER TABLE "course_groups" DROP COLUMN "signup_opens_at";
  ALTER TABLE "course_groups" DROP COLUMN "signup_closes_at";
  ALTER TABLE "sessions" DROP COLUMN "workshop_price";
  ALTER TABLE "sessions" DROP COLUMN "workshop_min_participants";
  ALTER TABLE "sessions" DROP COLUMN "workshop_max_participants";
  ALTER TABLE "sessions" DROP COLUMN "workshop_bookable";
  ALTER TABLE "sessions" DROP COLUMN "workshop_workshop_status";
  ALTER TABLE "sessions" DROP COLUMN "workshop_description";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "applications_id";
  DROP TYPE "public"."enum_course_groups_signup_kind";
  DROP TYPE "public"."enum_applications_kind";
  DROP TYPE "public"."enum_applications_status";
  DROP TYPE "public"."enum_sessions_workshop_workshop_status";`)
}
