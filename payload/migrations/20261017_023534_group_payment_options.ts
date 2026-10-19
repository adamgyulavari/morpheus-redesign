import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Online payment is set per kezdő group (its switch and its own payment options), not on the
// course: existing kezdő groups get their course's prices as options (instalments from notes like
// "2 × 80 000 Ft"); the course's switch and instalment field go.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "course_groups_signup_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"amount" numeric,
  	"installments" numeric DEFAULT 1,
  	"note" varchar,
  	"highlighted" boolean
  );
  
  ALTER TABLE "course_groups" ADD COLUMN "signup_pay_online" boolean DEFAULT false;
  ALTER TABLE "course_groups_signup_options" ADD CONSTRAINT "course_groups_signup_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "course_groups_signup_options_order_idx" ON "course_groups_signup_options" USING btree ("_order");
  CREATE INDEX "course_groups_signup_options_parent_id_idx" ON "course_groups_signup_options" USING btree ("_parent_id");
  INSERT INTO "course_groups_signup_options" ("_order", "_parent_id", "id", "label", "amount", "installments", "note", "highlighted")
    SELECT p."_order", g."id", substr(md5(random()::text || g."id"::text || p."id"), 1, 24), p."label", p."amount",
           coalesce(substring(p."note" from '^\\s*(\\d+)\\s*[×x]')::numeric, p."installments", 1), p."note", p."highlighted"
    FROM "course_groups" g
    JOIN "courses_prices" p ON p."_parent_id" = g."course_id"
    WHERE coalesce(g."signup_kind"::text, CASE WHEN g."type" = 'szakmai' THEN 'professional' ELSE 'beginner' END) = 'beginner';
  ALTER TABLE "courses_prices" DROP COLUMN "installments";
  ALTER TABLE "courses" DROP COLUMN "pay_online";`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "course_groups_signup_options" CASCADE;
  ALTER TABLE "courses_prices" ADD COLUMN IF NOT EXISTS "installments" numeric DEFAULT 1;
  ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "pay_online" boolean DEFAULT false;
  ALTER TABLE "course_groups" DROP COLUMN IF EXISTS "signup_pay_online";`);
}
