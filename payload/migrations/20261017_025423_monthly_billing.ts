import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Havi számlázás: kezdő orders keep their payment plan (backfilled from labels like
// "… — Két részletben (1. részlet a 2-ből)"); invoices without a checkout order (a szakmai month,
// a kezdő instalment) with their group, month, part, transfer due date and "Befizetve".

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_invoices_method" AS ENUM('card', 'transfer');
  ALTER TABLE "invoices" ALTER COLUMN "order_id" DROP NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "plan_label" varchar;
  ALTER TABLE "orders" ADD COLUMN "plan_total" numeric;
  ALTER TABLE "orders" ADD COLUMN "plan_parts" numeric;
  ALTER TABLE "invoices" ADD COLUMN "course_group_id" integer;
  ALTER TABLE "invoices" ADD COLUMN "period" varchar;
  ALTER TABLE "invoices" ADD COLUMN "part" numeric;
  ALTER TABLE "invoices" ADD COLUMN "method" "enum_invoices_method" DEFAULT 'card';
  ALTER TABLE "invoices" ADD COLUMN "due_date" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "paid_at" timestamp(3) with time zone;
  ALTER TABLE "billing_settings" ADD COLUMN "transfer_due_days" numeric DEFAULT 8;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_course_group_id_course_groups_id_fk" FOREIGN KEY ("course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "invoices_course_group_idx" ON "invoices" USING btree ("course_group_id");
  UPDATE "orders" SET
      "plan_parts" = coalesce(substring("label" from '\\(1\\. részlet a (\\d+)-ből\\)$')::numeric, 1),
      "plan_total" = "amount_due" * coalesce(substring("label" from '\\(1\\. részlet a (\\d+)-ből\\)$')::numeric, 1),
      "plan_label" = substring("label" from '— ([^—]+?)(?: \\(1\\. részlet a \\d+-ből\\))?$')
    WHERE "kind" = 'beginner' AND "plan_parts" IS NULL;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_course_group_id_course_groups_id_fk";
  DROP INDEX IF EXISTS "invoices_course_group_idx";
  DELETE FROM "invoices" WHERE "order_id" IS NULL;
  ALTER TABLE "invoices" ALTER COLUMN "order_id" SET NOT NULL;
  ALTER TABLE "orders" DROP COLUMN "plan_label";
  ALTER TABLE "orders" DROP COLUMN "plan_total";
  ALTER TABLE "orders" DROP COLUMN "plan_parts";
  ALTER TABLE "invoices" DROP COLUMN "course_group_id";
  ALTER TABLE "invoices" DROP COLUMN "period";
  ALTER TABLE "invoices" DROP COLUMN "part";
  ALTER TABLE "invoices" DROP COLUMN "method";
  ALTER TABLE "invoices" DROP COLUMN "due_date";
  ALTER TABLE "invoices" DROP COLUMN "paid_at";
  ALTER TABLE "billing_settings" DROP COLUMN "transfer_due_days";
  DROP TYPE "public"."enum_invoices_method";`);
}
