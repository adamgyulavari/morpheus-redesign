import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_invoices_kind" AS ENUM('invoice', 'storno');
  CREATE TYPE "public"."enum_invoices_status" AS ENUM('draft', 'sending', 'issued', 'failed');
  CREATE TYPE "public"."enum_invoices_mode" AS ENUM('off', 'test', 'live');
  CREATE TABLE "invoices" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"kind" "enum_invoices_kind" NOT NULL,
  	"status" "enum_invoices_status" NOT NULL,
  	"mode" "enum_invoices_mode" NOT NULL,
  	"number" varchar,
  	"order_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"net" numeric DEFAULT 0 NOT NULL,
  	"vat" numeric DEFAULT 0 NOT NULL,
  	"gross" numeric DEFAULT 0 NOT NULL,
  	"storno_of_id" integer,
  	"issued_at" timestamp(3) with time zone,
  	"error" varchar,
  	"data" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoices_id" integer;
  ALTER TABLE "billing_settings" ADD COLUMN "invoice_prefix" varchar;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_storno_of_id_invoices_id_fk" FOREIGN KEY ("storno_of_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "invoices_key_idx" ON "invoices" USING btree ("key");
  CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");
  CREATE INDEX "invoices_order_idx" ON "invoices" USING btree ("order_id");
  CREATE INDEX "invoices_user_idx" ON "invoices" USING btree ("user_id");
  CREATE INDEX "invoices_storno_of_idx" ON "invoices" USING btree ("storno_of_id");
  CREATE INDEX "invoices_updated_at_idx" ON "invoices" USING btree ("updated_at");
  CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoices_fk" FOREIGN KEY ("invoices_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_invoices_id_idx" ON "payload_locked_documents_rels" USING btree ("invoices_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "invoices" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "invoices" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_invoices_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_invoices_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoices_id";
  ALTER TABLE "billing_settings" DROP COLUMN "invoice_prefix";
  DROP TYPE "public"."enum_invoices_kind";
  DROP TYPE "public"."enum_invoices_status";
  DROP TYPE "public"."enum_invoices_mode";`)
}
