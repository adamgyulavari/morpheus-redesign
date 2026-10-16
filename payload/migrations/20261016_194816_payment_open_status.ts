import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_payments_status" ADD VALUE 'open' BEFORE 'pending';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
  UPDATE "payments" SET "status" = 'pending' WHERE "status" = 'open';
  DROP TYPE "public"."enum_payments_status";
  CREATE TYPE "public"."enum_payments_status" AS ENUM('pending', 'paid', 'failed', 'expired', 'canceled', 'refunded', 'partially_refunded');
  ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_payments_status";
  ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE "public"."enum_payments_status" USING "status"::"public"."enum_payments_status";`)
}
