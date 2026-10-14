import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_application_settings_workshop_defaults_weekday" AS ENUM('1', '2', '3', '4', '5', '6', '7');
  CREATE TABLE "application_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"rooms_id" integer
  );
  
  ALTER TABLE "application_settings" ADD COLUMN "workshop_defaults_weekday" "enum_application_settings_workshop_defaults_weekday" DEFAULT '6';
  ALTER TABLE "application_settings" ADD COLUMN "workshop_defaults_start_time" varchar DEFAULT '14:00';
  ALTER TABLE "application_settings" ADD COLUMN "workshop_defaults_end_time" varchar DEFAULT '16:00';
  ALTER TABLE "application_settings" ADD COLUMN "workshop_defaults_price" numeric DEFAULT 5000;
  ALTER TABLE "application_settings" ADD COLUMN "workshop_defaults_min_participants" numeric DEFAULT 5;
  ALTER TABLE "application_settings" ADD COLUMN "workshop_defaults_max_participants" numeric DEFAULT 16;
  ALTER TABLE "application_settings_rels" ADD CONSTRAINT "application_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."application_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "application_settings_rels" ADD CONSTRAINT "application_settings_rels_rooms_fk" FOREIGN KEY ("rooms_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "application_settings_rels_order_idx" ON "application_settings_rels" USING btree ("order");
  CREATE INDEX "application_settings_rels_parent_idx" ON "application_settings_rels" USING btree ("parent_id");
  CREATE INDEX "application_settings_rels_path_idx" ON "application_settings_rels" USING btree ("path");
  CREATE INDEX "application_settings_rels_rooms_id_idx" ON "application_settings_rels" USING btree ("rooms_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "application_settings_rels" CASCADE;
  ALTER TABLE "application_settings" DROP COLUMN "workshop_defaults_weekday";
  ALTER TABLE "application_settings" DROP COLUMN "workshop_defaults_start_time";
  ALTER TABLE "application_settings" DROP COLUMN "workshop_defaults_end_time";
  ALTER TABLE "application_settings" DROP COLUMN "workshop_defaults_price";
  ALTER TABLE "application_settings" DROP COLUMN "workshop_defaults_min_participants";
  ALTER TABLE "application_settings" DROP COLUMN "workshop_defaults_max_participants";
  DROP TYPE "public"."enum_application_settings_workshop_defaults_weekday";`)
}
