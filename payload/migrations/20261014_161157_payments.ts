import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_kind" AS ENUM('workshop', 'beginner', 'monthlyFee');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'paid', 'expired', 'canceled', 'refunded', 'partially_refunded');
  CREATE TYPE "public"."enum_payments_status" AS ENUM('pending', 'paid', 'failed', 'expired', 'canceled', 'refunded', 'partially_refunded');
  CREATE TYPE "public"."enum_mock_payments_status" AS ENUM('pending', 'paid', 'failed', 'expired', 'canceled');
  CREATE TYPE "public"."enum_billing_settings_vat_mode" AS ENUM('AAM', '27', '18', '5');
  ALTER TYPE "public"."enum_applications_status" ADD VALUE 'held' BEFORE 'registered';
  ALTER TYPE "public"."enum_applications_status" ADD VALUE 'credited' BEFORE 'new';
  ALTER TYPE "public"."enum_applications_status" ADD VALUE 'refunded' BEFORE 'new';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'orderPaid';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'expireOrders';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'orderPaid';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'expireOrders';
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"application_id" integer,
  	"kind" "enum_orders_kind" NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending' NOT NULL,
  	"label" varchar NOT NULL,
  	"price" numeric DEFAULT 0 NOT NULL,
  	"credit_used" numeric DEFAULT 0 NOT NULL,
  	"amount_due" numeric DEFAULT 0 NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"paid_at" timestamp(3) with time zone,
  	"billing_name" varchar,
  	"billing_tax_number" varchar,
  	"billing_zip" varchar,
  	"billing_city" varchar,
  	"billing_country" varchar,
  	"billing_address" varchar,
  	"token" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payments_refunds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provider_refund_id" varchar,
  	"amount" numeric DEFAULT 0 NOT NULL,
  	"at" timestamp(3) with time zone,
  	"by_id" integer
  );
  
  CREATE TABLE "payments_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"source" varchar,
  	"status" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"provider" varchar NOT NULL,
  	"provider_payment_id" varchar NOT NULL,
  	"amount" numeric DEFAULT 0 NOT NULL,
  	"status" "enum_payments_status" DEFAULT 'pending' NOT NULL,
  	"paid_at" timestamp(3) with time zone,
  	"raw" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "mock_payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"amount_refunded" numeric DEFAULT 0,
  	"description" varchar,
  	"status" "enum_mock_payments_status" DEFAULT 'pending' NOT NULL,
  	"paid_at" timestamp(3) with time zone,
  	"return_url" varchar,
  	"webhook_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "billing_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"vat_mode" "enum_billing_settings_vat_mode" DEFAULT 'AAM' NOT NULL,
  	"orders_hold_minutes" numeric DEFAULT 30 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users" ADD COLUMN "billing_name" varchar;
  ALTER TABLE "users" ADD COLUMN "billing_tax_number" varchar;
  ALTER TABLE "users" ADD COLUMN "billing_zip" varchar;
  ALTER TABLE "users" ADD COLUMN "billing_city" varchar;
  ALTER TABLE "users" ADD COLUMN "billing_country" varchar DEFAULT 'HU';
  ALTER TABLE "users" ADD COLUMN "billing_address" varchar;
  ALTER TABLE "applications" ADD COLUMN "order_id" integer;
  ALTER TABLE "applications" ADD COLUMN "hold_until" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payments_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "mock_payments_id" integer;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments_refunds" ADD CONSTRAINT "payments_refunds_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments_refunds" ADD CONSTRAINT "payments_refunds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payments_log" ADD CONSTRAINT "payments_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");
  CREATE INDEX "orders_application_idx" ON "orders" USING btree ("application_id");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_expires_at_idx" ON "orders" USING btree ("expires_at");
  CREATE UNIQUE INDEX "orders_token_idx" ON "orders" USING btree ("token");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "payments_refunds_order_idx" ON "payments_refunds" USING btree ("_order");
  CREATE INDEX "payments_refunds_parent_id_idx" ON "payments_refunds" USING btree ("_parent_id");
  CREATE INDEX "payments_refunds_by_idx" ON "payments_refunds" USING btree ("by_id");
  CREATE INDEX "payments_log_order_idx" ON "payments_log" USING btree ("_order");
  CREATE INDEX "payments_log_parent_id_idx" ON "payments_log" USING btree ("_parent_id");
  CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");
  CREATE UNIQUE INDEX "payments_provider_payment_id_idx" ON "payments" USING btree ("provider_payment_id");
  CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");
  CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");
  CREATE INDEX "mock_payments_updated_at_idx" ON "mock_payments" USING btree ("updated_at");
  CREATE INDEX "mock_payments_created_at_idx" ON "mock_payments" USING btree ("created_at");
  ALTER TABLE "applications" ADD CONSTRAINT "applications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mock_payments_fk" FOREIGN KEY ("mock_payments_id") REFERENCES "public"."mock_payments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "applications_order_idx" ON "applications" USING btree ("order_id");
  CREATE INDEX "applications_hold_until_idx" ON "applications" USING btree ("hold_until");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("payments_id");
  CREATE INDEX "payload_locked_documents_rels_mock_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("mock_payments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payments_refunds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payments_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mock_payments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "billing_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "payments_refunds" CASCADE;
  DROP TABLE "payments_log" CASCADE;
  DROP TABLE "payments" CASCADE;
  DROP TABLE "mock_payments" CASCADE;
  DROP TABLE "billing_settings" CASCADE;
  ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_order_id_orders_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_mock_payments_fk";
  
  -- the new statuses don't exist before: closed ones become "cancelled"; the partial unique
  -- indexes on status are rebuilt around the type change
  UPDATE "applications" SET "status" = 'cancelled' WHERE "status" IN ('held', 'credited', 'refunded');
  DROP INDEX IF EXISTS "applications_one_active_per_session";
  DROP INDEX IF EXISTS "applications_one_active_per_course_group";
  DROP INDEX IF EXISTS "applications_one_open_without_group";
  DELETE FROM "payload_jobs_log" WHERE "task_slug" IN ('orderPaid', 'expireOrders');
  DELETE FROM "payload_jobs" WHERE "task_slug" IN ('orderPaid', 'expireOrders');
  ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE text;
  DROP TYPE "public"."enum_applications_status";
  CREATE TYPE "public"."enum_applications_status" AS ENUM('registered', 'cancelled', 'moved', 'new', 'interview', 'accepted', 'rejected', 'withdrawn');
  ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."enum_applications_status" USING "status"::"public"."enum_applications_status";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'revalidateDates', 'workshopCutoff');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'revalidateDates', 'workshopCutoff');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "applications_order_idx";
  DROP INDEX "applications_hold_until_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  DROP INDEX "payload_locked_documents_rels_payments_id_idx";
  DROP INDEX "payload_locked_documents_rels_mock_payments_id_idx";
  ALTER TABLE "users" DROP COLUMN "billing_name";
  ALTER TABLE "users" DROP COLUMN "billing_tax_number";
  ALTER TABLE "users" DROP COLUMN "billing_zip";
  ALTER TABLE "users" DROP COLUMN "billing_city";
  ALTER TABLE "users" DROP COLUMN "billing_country";
  ALTER TABLE "users" DROP COLUMN "billing_address";
  ALTER TABLE "applications" DROP COLUMN "order_id";
  ALTER TABLE "applications" DROP COLUMN "hold_until";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "mock_payments_id";
  DROP TYPE "public"."enum_orders_kind";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_payments_status";
  DROP TYPE "public"."enum_mock_payments_status";
  DROP TYPE "public"."enum_billing_settings_vat_mode";
  CREATE UNIQUE INDEX "applications_one_active_per_session" ON "applications" ("user_id", "session_id")
    WHERE "session_id" IS NOT NULL AND "status" IN ('registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_active_per_course_group" ON "applications" ("user_id", "course_group_id")
    WHERE "course_group_id" IS NOT NULL AND "status" IN ('registered', 'new', 'interview', 'accepted');
  CREATE UNIQUE INDEX "applications_one_open_without_group" ON "applications" ("user_id", "kind", COALESCE("course_id", 0))
    WHERE "kind" <> 'workshop' AND "course_group_id" IS NULL AND "status" IN ('registered', 'new', 'interview');`)
}
