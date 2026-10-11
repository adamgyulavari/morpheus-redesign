import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_course_groups_default_schedule_weekday" AS ENUM('1', '2', '3', '4', '5', '6', '7');
  CREATE TYPE "public"."enum_student_links_audience" AS ENUM('all', 'courseGroups');
  CREATE TYPE "public"."enum_sessions_kind" AS ENUM('course', 'rehearsal', 'exam', 'show', 'other');
  CREATE TYPE "public"."enum_sessions_status" AS ENUM('scheduled', 'cancelled');
  CREATE TYPE "public"."enum_sessions_location_type" AS ENUM('room', 'external', 'unplaced');
  CREATE TYPE "public"."enum_room_bookings_kind" AS ENUM('session', 'practice', 'rental', 'other');
  CREATE TYPE "public"."enum_room_bookings_status" AS ENUM('confirmed', 'cancelled');
  CREATE TYPE "public"."enum_room_booking_settings_slot_minutes" AS ENUM('15', '30', '60');
  CREATE TABLE "course_groups_default_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"weekday" "enum_course_groups_default_schedule_weekday" NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL
  );
  
  CREATE TABLE "student_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"description" varchar,
  	"audience" "enum_student_links_audience" DEFAULT 'all' NOT NULL,
  	"active" boolean DEFAULT true,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "student_links_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"course_groups_id" integer
  );
  
  CREATE TABLE "sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_title" varchar,
  	"title" varchar,
  	"kind" "enum_sessions_kind" DEFAULT 'course' NOT NULL,
  	"status" "enum_sessions_status" DEFAULT 'scheduled' NOT NULL,
  	"course_group_id" integer,
  	"production_id" integer,
  	"start" timestamp(3) with time zone NOT NULL,
  	"end" timestamp(3) with time zone NOT NULL,
  	"location_type" "enum_sessions_location_type" DEFAULT 'room' NOT NULL,
  	"external_location" varchar,
  	"booking_id" integer,
  	"notes" varchar,
  	"generated_from_course_group_id" integer,
  	"generated_from_entry" numeric,
  	"generated_from_day" varchar,
  	"customized" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sessions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"rooms_id" integer
  );
  
  CREATE TABLE "room_bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_title" varchar,
  	"kind" "enum_room_bookings_kind" DEFAULT 'rental' NOT NULL,
  	"status" "enum_room_bookings_status" DEFAULT 'confirmed' NOT NULL,
  	"start" timestamp(3) with time zone NOT NULL,
  	"end" timestamp(3) with time zone NOT NULL,
  	"title" varchar,
  	"session_id" integer,
  	"user_id" integer,
  	"course_group_id" integer,
  	"production_id" integer,
  	"cancelled_by_id" integer,
  	"cancelled_at" timestamp(3) with time zone,
  	"cancel_reason" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "room_bookings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"rooms_id" integer
  );
  
  CREATE TABLE "rooms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"capacity" numeric,
  	"color" varchar DEFAULT '#0f5f63' NOT NULL,
  	"photo_id" integer,
  	"active" boolean DEFAULT true,
  	"student_bookable" boolean DEFAULT true,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "room_booking_settings_closed_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "room_booking_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"student_hours_from" varchar,
  	"student_hours_to" varchar,
  	"slot_minutes" "enum_room_booking_settings_slot_minutes" DEFAULT '30' NOT NULL,
  	"max_hours" numeric DEFAULT 8 NOT NULL,
  	"horizon_days" numeric DEFAULT 30 NOT NULL,
  	"min_notice_hours" numeric DEFAULT 0 NOT NULL,
  	"weekly_quota_hours" numeric,
  	"cancel_hours_before" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "productions_rels" ADD COLUMN "course_groups_id" integer;
  ALTER TABLE "_productions_v_rels" ADD COLUMN "course_groups_id" integer;
  ALTER TABLE "course_groups_rels" ADD COLUMN "rooms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "student_links_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sessions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "room_bookings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rooms_id" integer;
  ALTER TABLE "course_groups_default_schedule" ADD CONSTRAINT "course_groups_default_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "student_links_rels" ADD CONSTRAINT "student_links_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."student_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "student_links_rels" ADD CONSTRAINT "student_links_rels_course_groups_fk" FOREIGN KEY ("course_groups_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_course_group_id_course_groups_id_fk" FOREIGN KEY ("course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_booking_id_room_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."room_bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_generated_from_course_group_id_course_groups_id_fk" FOREIGN KEY ("generated_from_course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_rooms_fk" FOREIGN KEY ("rooms_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_course_group_id_course_groups_id_fk" FOREIGN KEY ("course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "room_bookings_rels" ADD CONSTRAINT "room_bookings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."room_bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "room_bookings_rels" ADD CONSTRAINT "room_bookings_rels_rooms_fk" FOREIGN KEY ("rooms_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rooms" ADD CONSTRAINT "rooms_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "room_booking_settings_closed_dates" ADD CONSTRAINT "room_booking_settings_closed_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."room_booking_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "course_groups_default_schedule_order_idx" ON "course_groups_default_schedule" USING btree ("_order");
  CREATE INDEX "course_groups_default_schedule_parent_id_idx" ON "course_groups_default_schedule" USING btree ("_parent_id");
  CREATE INDEX "student_links_updated_at_idx" ON "student_links" USING btree ("updated_at");
  CREATE INDEX "student_links_created_at_idx" ON "student_links" USING btree ("created_at");
  CREATE INDEX "student_links_rels_order_idx" ON "student_links_rels" USING btree ("order");
  CREATE INDEX "student_links_rels_parent_idx" ON "student_links_rels" USING btree ("parent_id");
  CREATE INDEX "student_links_rels_path_idx" ON "student_links_rels" USING btree ("path");
  CREATE INDEX "student_links_rels_course_groups_id_idx" ON "student_links_rels" USING btree ("course_groups_id");
  CREATE INDEX "sessions_display_title_idx" ON "sessions" USING btree ("display_title");
  CREATE INDEX "sessions_course_group_idx" ON "sessions" USING btree ("course_group_id");
  CREATE INDEX "sessions_production_idx" ON "sessions" USING btree ("production_id");
  CREATE INDEX "sessions_start_idx" ON "sessions" USING btree ("start");
  CREATE INDEX "sessions_end_idx" ON "sessions" USING btree ("end");
  CREATE INDEX "sessions_location_type_idx" ON "sessions" USING btree ("location_type");
  CREATE INDEX "sessions_booking_idx" ON "sessions" USING btree ("booking_id");
  CREATE INDEX "sessions_generated_from_generated_from_course_group_idx" ON "sessions" USING btree ("generated_from_course_group_id");
  CREATE INDEX "sessions_generated_from_generated_from_day_idx" ON "sessions" USING btree ("generated_from_day");
  CREATE INDEX "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");
  CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");
  CREATE INDEX "sessions_rels_order_idx" ON "sessions_rels" USING btree ("order");
  CREATE INDEX "sessions_rels_parent_idx" ON "sessions_rels" USING btree ("parent_id");
  CREATE INDEX "sessions_rels_path_idx" ON "sessions_rels" USING btree ("path");
  CREATE INDEX "sessions_rels_rooms_id_idx" ON "sessions_rels" USING btree ("rooms_id");
  CREATE INDEX "room_bookings_start_idx" ON "room_bookings" USING btree ("start");
  CREATE INDEX "room_bookings_end_idx" ON "room_bookings" USING btree ("end");
  CREATE INDEX "room_bookings_session_idx" ON "room_bookings" USING btree ("session_id");
  CREATE INDEX "room_bookings_user_idx" ON "room_bookings" USING btree ("user_id");
  CREATE INDEX "room_bookings_course_group_idx" ON "room_bookings" USING btree ("course_group_id");
  CREATE INDEX "room_bookings_production_idx" ON "room_bookings" USING btree ("production_id");
  CREATE INDEX "room_bookings_cancelled_by_idx" ON "room_bookings" USING btree ("cancelled_by_id");
  CREATE INDEX "room_bookings_cancelled_at_idx" ON "room_bookings" USING btree ("cancelled_at");
  CREATE INDEX "room_bookings_updated_at_idx" ON "room_bookings" USING btree ("updated_at");
  CREATE INDEX "room_bookings_created_at_idx" ON "room_bookings" USING btree ("created_at");
  CREATE INDEX "room_bookings_rels_order_idx" ON "room_bookings_rels" USING btree ("order");
  CREATE INDEX "room_bookings_rels_parent_idx" ON "room_bookings_rels" USING btree ("parent_id");
  CREATE INDEX "room_bookings_rels_path_idx" ON "room_bookings_rels" USING btree ("path");
  CREATE INDEX "room_bookings_rels_rooms_id_idx" ON "room_bookings_rels" USING btree ("rooms_id");
  CREATE UNIQUE INDEX "rooms_slug_idx" ON "rooms" USING btree ("slug");
  CREATE INDEX "rooms_photo_idx" ON "rooms" USING btree ("photo_id");
  CREATE INDEX "rooms_updated_at_idx" ON "rooms" USING btree ("updated_at");
  CREATE INDEX "rooms_created_at_idx" ON "rooms" USING btree ("created_at");
  CREATE INDEX "room_booking_settings_closed_dates_order_idx" ON "room_booking_settings_closed_dates" USING btree ("_order");
  CREATE INDEX "room_booking_settings_closed_dates_parent_id_idx" ON "room_booking_settings_closed_dates" USING btree ("_parent_id");
  ALTER TABLE "productions_rels" ADD CONSTRAINT "productions_rels_course_groups_fk" FOREIGN KEY ("course_groups_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_productions_v_rels" ADD CONSTRAINT "_productions_v_rels_course_groups_fk" FOREIGN KEY ("course_groups_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_groups_rels" ADD CONSTRAINT "course_groups_rels_rooms_fk" FOREIGN KEY ("rooms_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_student_links_fk" FOREIGN KEY ("student_links_id") REFERENCES "public"."student_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_room_bookings_fk" FOREIGN KEY ("room_bookings_id") REFERENCES "public"."room_bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rooms_fk" FOREIGN KEY ("rooms_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "productions_rels_course_groups_id_idx" ON "productions_rels" USING btree ("course_groups_id");
  CREATE INDEX "_productions_v_rels_course_groups_id_idx" ON "_productions_v_rels" USING btree ("course_groups_id");
  CREATE INDEX "course_groups_rels_rooms_id_idx" ON "course_groups_rels" USING btree ("rooms_id");
  CREATE INDEX "payload_locked_documents_rels_student_links_id_idx" ON "payload_locked_documents_rels" USING btree ("student_links_id");
  CREATE INDEX "payload_locked_documents_rels_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("sessions_id");
  CREATE INDEX "payload_locked_documents_rels_room_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("room_bookings_id");
  CREATE INDEX "payload_locked_documents_rels_rooms_id_idx" ON "payload_locked_documents_rels" USING btree ("rooms_id");`)

  // The clash guarantee (lib/rooms/occupancy.ts): one row per room of each confirmed booking;
  // Postgres refuses two rows of the same room with overlapping periods, even under concurrency.
  await db.execute(sql`
  CREATE EXTENSION IF NOT EXISTS btree_gist;
  CREATE TABLE "room_occupancy" (
    "booking_id" integer NOT NULL REFERENCES "room_bookings"("id") ON DELETE CASCADE,
    "room_id" integer NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
    "period" tstzrange NOT NULL,
    PRIMARY KEY ("booking_id", "room_id"),
    CONSTRAINT "room_occupancy_no_overlap" EXCLUDE USING gist ("room_id" WITH =, "period" WITH &&)
  );`)

  // The studio's rooms, and an example link for students (inactive until it gets a real address).
  await db.execute(sql`
  INSERT INTO "rooms" ("name", "slug", "color", "active", "student_bookable", "order") VALUES
    ('Nagyterem', 'nagyterem', '#0f5f63', true, true, 1),
    ('Próbaterem', 'probaterem', '#c24e2c', true, true, 2),
    ('Iroda', 'iroda', '#b8860b', true, false, 3)
  ON CONFLICT ("slug") DO NOTHING;
  INSERT INTO "student_links" ("title", "url", "description", "audience", "active", "order") VALUES
    ('Heti órarend', 'https://docs.google.com/', 'Példa: cseréld a valódi órarend linkjére, és kapcsold be.', 'all', false, 1);`)

}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "room_occupancy";
   ALTER TABLE "course_groups_default_schedule" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "student_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "student_links_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sessions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "room_bookings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "room_bookings_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rooms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "room_booking_settings_closed_dates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "room_booking_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "course_groups_default_schedule" CASCADE;
  DROP TABLE "student_links" CASCADE;
  DROP TABLE "student_links_rels" CASCADE;
  DROP TABLE "sessions" CASCADE;
  DROP TABLE "sessions_rels" CASCADE;
  DROP TABLE "room_bookings" CASCADE;
  DROP TABLE "room_bookings_rels" CASCADE;
  DROP TABLE "rooms" CASCADE;
  DROP TABLE "room_booking_settings_closed_dates" CASCADE;
  DROP TABLE "room_booking_settings" CASCADE;
  ALTER TABLE "productions_rels" DROP CONSTRAINT IF EXISTS "productions_rels_course_groups_fk";
  
  ALTER TABLE "_productions_v_rels" DROP CONSTRAINT IF EXISTS "_productions_v_rels_course_groups_fk";
  
  ALTER TABLE "course_groups_rels" DROP CONSTRAINT IF EXISTS "course_groups_rels_rooms_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_student_links_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_sessions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_room_bookings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_rooms_fk";
  
  DROP INDEX IF EXISTS "productions_rels_course_groups_id_idx";
  DROP INDEX IF EXISTS "_productions_v_rels_course_groups_id_idx";
  DROP INDEX IF EXISTS "course_groups_rels_rooms_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_student_links_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_sessions_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_room_bookings_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_rooms_id_idx";
  ALTER TABLE "productions_rels" DROP COLUMN "course_groups_id";
  ALTER TABLE "_productions_v_rels" DROP COLUMN "course_groups_id";
  ALTER TABLE "course_groups_rels" DROP COLUMN "rooms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "student_links_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sessions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "room_bookings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rooms_id";
  DROP TYPE "public"."enum_course_groups_default_schedule_weekday";
  DROP TYPE "public"."enum_student_links_audience";
  DROP TYPE "public"."enum_sessions_kind";
  DROP TYPE "public"."enum_sessions_status";
  DROP TYPE "public"."enum_sessions_location_type";
  DROP TYPE "public"."enum_room_bookings_kind";
  DROP TYPE "public"."enum_room_bookings_status";
  DROP TYPE "public"."enum_room_booking_settings_slot_minutes";`)
}
