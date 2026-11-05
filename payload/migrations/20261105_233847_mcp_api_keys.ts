import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload_mcp_api_keys" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"pages_find" boolean DEFAULT false,
  	"pages_create" boolean DEFAULT false,
  	"pages_update" boolean DEFAULT false,
  	"productions_find" boolean DEFAULT false,
  	"productions_create" boolean DEFAULT false,
  	"productions_update" boolean DEFAULT false,
  	"shows_find" boolean DEFAULT false,
  	"shows_create" boolean DEFAULT false,
  	"shows_update" boolean DEFAULT false,
  	"venues_find" boolean DEFAULT false,
  	"venues_create" boolean DEFAULT false,
  	"venues_update" boolean DEFAULT false,
  	"courses_find" boolean DEFAULT false,
  	"courses_update" boolean DEFAULT false,
  	"workshops_find" boolean DEFAULT false,
  	"workshops_create" boolean DEFAULT false,
  	"workshops_update" boolean DEFAULT false,
  	"instructors_find" boolean DEFAULT false,
  	"instructors_create" boolean DEFAULT false,
  	"instructors_update" boolean DEFAULT false,
  	"reviews_find" boolean DEFAULT false,
  	"reviews_create" boolean DEFAULT false,
  	"reviews_update" boolean DEFAULT false,
  	"contact_people_find" boolean DEFAULT false,
  	"contact_people_update" boolean DEFAULT false,
  	"team_building_programmes_find" boolean DEFAULT false,
  	"team_building_programmes_create" boolean DEFAULT false,
  	"team_building_programmes_update" boolean DEFAULT false,
  	"cta_bands_find" boolean DEFAULT false,
  	"cta_bands_create" boolean DEFAULT false,
  	"cta_bands_update" boolean DEFAULT false,
  	"legal_pages_find" boolean DEFAULT false,
  	"legal_pages_update" boolean DEFAULT false,
  	"redirects_find" boolean DEFAULT false,
  	"redirects_create" boolean DEFAULT false,
  	"redirects_update" boolean DEFAULT false,
  	"media_find" boolean DEFAULT false,
  	"media_update" boolean DEFAULT false,
  	"ui_texts_find" boolean DEFAULT false,
  	"ui_texts_update" boolean DEFAULT false,
  	"site_settings_find" boolean DEFAULT false,
  	"site_settings_update" boolean DEFAULT false,
  	"email_texts_find" boolean DEFAULT false,
  	"email_texts_update" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
  CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
  CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_mcp_api_keys" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_mcp_api_keys" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk";
  
  DROP INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
  DROP INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_mcp_api_keys_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "payload_mcp_api_keys_id";`)
}
