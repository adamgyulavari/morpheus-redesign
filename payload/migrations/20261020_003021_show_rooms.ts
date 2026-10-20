import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// A show at our own venue takes every room (lib/rooms/show-rooms.ts): the venue setting and the
// show's room times in Teremfoglalási szabályok, the show's session link, the staff note on the
// show. The venue starts as Frankel Leó út, where the rooms are.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "shows" ADD COLUMN "room_note" varchar;
  ALTER TABLE "sessions" ADD COLUMN "show_id" integer;
  ALTER TABLE "room_booking_settings" ADD COLUMN "home_venue_id" integer;
  ALTER TABLE "room_booking_settings" ADD COLUMN "show_rooms_before" numeric DEFAULT 90 NOT NULL;
  ALTER TABLE "room_booking_settings" ADD COLUMN "show_rooms_after" numeric DEFAULT 150 NOT NULL;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "room_booking_settings" ADD CONSTRAINT "room_booking_settings_home_venue_id_venues_id_fk" FOREIGN KEY ("home_venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "sessions_show_idx" ON "sessions" USING btree ("show_id");
  CREATE INDEX "room_booking_settings_home_venue_idx" ON "room_booking_settings" USING btree ("home_venue_id");
  UPDATE "room_booking_settings" SET "home_venue_id" = (SELECT "id" FROM "venues" WHERE "name" ILIKE '%Frankel Leó%' ORDER BY "id" LIMIT 1);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sessions" DROP CONSTRAINT "sessions_show_id_shows_id_fk";
  
  ALTER TABLE "room_booking_settings" DROP CONSTRAINT "room_booking_settings_home_venue_id_venues_id_fk";
  
  DROP INDEX "sessions_show_idx";
  DROP INDEX "room_booking_settings_home_venue_idx";
  ALTER TABLE "shows" DROP COLUMN "room_note";
  ALTER TABLE "sessions" DROP COLUMN "show_id";
  ALTER TABLE "room_booking_settings" DROP COLUMN "home_venue_id";
  ALTER TABLE "room_booking_settings" DROP COLUMN "show_rooms_before";
  ALTER TABLE "room_booking_settings" DROP COLUMN "show_rooms_after";`)
}
