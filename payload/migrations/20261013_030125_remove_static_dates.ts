import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The upcoming static Nyitott Műhely dates become workshop sessions (no place yet, bookable;
  // their day and clock times are Budapest's). Past dates and the static course starts go: the
  // course pages show the course groups open for sign-up instead.
  await db.execute(sql`
  INSERT INTO "sessions" ("display_title", "kind", "status", "start", "end", "location_type",
    "workshop_price", "workshop_min_participants", "workshop_max_participants", "workshop_bookable", "workshop_workshop_status")
  SELECT 'Nyitott Műhely', 'workshop', 'scheduled',
    (((o."date" AT TIME ZONE 'Europe/Budapest')::date + o."start_time"::time) AT TIME ZONE 'Europe/Budapest'),
    (((o."date" AT TIME ZONE 'Europe/Budapest')::date + o."end_time"::time) AT TIME ZONE 'Europe/Budapest'),
    'unplaced', o."price", 5, 16, true, 'open'
  FROM "open_workshop_sessions" o
  WHERE (((o."date" AT TIME ZONE 'Europe/Budapest')::date + o."start_time"::time) AT TIME ZONE 'Europe/Budapest') > now();`)

  await db.execute(sql`
   ALTER TABLE "courses_starts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "open_workshop_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "courses_starts" CASCADE;
  DROP TABLE "open_workshop_sessions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_open_workshop_sessions_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_open_workshop_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "open_workshop_sessions_id";
  ALTER TABLE "ui" DROP COLUMN "sessions_open";
  ALTER TABLE "ui" DROP COLUMN "sessions_closed_text";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "courses_starts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL
  );
  
  CREATE TABLE "open_workshop_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"booking_url" varchar NOT NULL,
  	"booking_deadline" timestamp(3) with time zone NOT NULL,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "open_workshop_sessions_id" integer;
  ALTER TABLE "ui" ADD COLUMN "sessions_open" varchar NOT NULL DEFAULT 'Foglalás {deadline}, csütörtök éjfélig';
  ALTER TABLE "ui" ADD COLUMN "sessions_closed_text" varchar NOT NULL DEFAULT 'A foglalás erre az alkalomra lezárult';
  ALTER TABLE "courses_starts" ADD CONSTRAINT "courses_starts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_starts_order_idx" ON "courses_starts" USING btree ("_order");
  CREATE INDEX "courses_starts_parent_id_idx" ON "courses_starts" USING btree ("_parent_id");
  CREATE INDEX "courses_starts_date_idx" ON "courses_starts" USING btree ("date");
  CREATE INDEX "open_workshop_sessions_date_idx" ON "open_workshop_sessions" USING btree ("date");
  CREATE INDEX "open_workshop_sessions_booking_deadline_idx" ON "open_workshop_sessions" USING btree ("booking_deadline");
  CREATE UNIQUE INDEX "open_workshop_sessions_import_id_idx" ON "open_workshop_sessions" USING btree ("import_id");
  CREATE INDEX "open_workshop_sessions_updated_at_idx" ON "open_workshop_sessions" USING btree ("updated_at");
  CREATE INDEX "open_workshop_sessions_created_at_idx" ON "open_workshop_sessions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_open_workshop_sessions_fk" FOREIGN KEY ("open_workshop_sessions_id") REFERENCES "public"."open_workshop_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_open_workshop_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("open_workshop_sessions_id");`)
}
