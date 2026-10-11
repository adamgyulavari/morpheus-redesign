import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_course_groups_type" AS ENUM('kezdo', 'szakmai', 'egyeb');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'staff', 'student');
  CREATE TABLE "course_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "enum_course_groups_type" NOT NULL,
  	"course_id" integer,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"monthly_fee" numeric,
  	"invoice_day" numeric DEFAULT 5,
  	"info" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "course_groups_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "login_tokens" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"token_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"used_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "users" ADD COLUMN "last_name" varchar;
  ALTER TABLE "users" ADD COLUMN "first_name" varchar;
  ALTER TABLE "users" ADD COLUMN "phone" varchar;
  ALTER TABLE "users" ADD COLUMN "_verified" boolean;
  ALTER TABLE "users" ADD COLUMN "_verificationtoken" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "course_groups_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "login_tokens_id" integer;
  ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_groups_rels" ADD CONSTRAINT "course_groups_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_groups_rels" ADD CONSTRAINT "course_groups_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "login_tokens" ADD CONSTRAINT "login_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "course_groups_course_idx" ON "course_groups" USING btree ("course_id");
  CREATE INDEX "course_groups_start_date_idx" ON "course_groups" USING btree ("start_date");
  CREATE INDEX "course_groups_end_date_idx" ON "course_groups" USING btree ("end_date");
  CREATE INDEX "course_groups_updated_at_idx" ON "course_groups" USING btree ("updated_at");
  CREATE INDEX "course_groups_created_at_idx" ON "course_groups" USING btree ("created_at");
  CREATE INDEX "course_groups_rels_order_idx" ON "course_groups_rels" USING btree ("order");
  CREATE INDEX "course_groups_rels_parent_idx" ON "course_groups_rels" USING btree ("parent_id");
  CREATE INDEX "course_groups_rels_path_idx" ON "course_groups_rels" USING btree ("path");
  CREATE INDEX "course_groups_rels_users_id_idx" ON "course_groups_rels" USING btree ("users_id");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "login_tokens_user_idx" ON "login_tokens" USING btree ("user_id");
  CREATE UNIQUE INDEX "login_tokens_token_hash_idx" ON "login_tokens" USING btree ("token_hash");
  CREATE INDEX "login_tokens_expires_at_idx" ON "login_tokens" USING btree ("expires_at");
  CREATE INDEX "login_tokens_updated_at_idx" ON "login_tokens" USING btree ("updated_at");
  CREATE INDEX "login_tokens_created_at_idx" ON "login_tokens" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_groups_fk" FOREIGN KEY ("course_groups_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_login_tokens_fk" FOREIGN KEY ("login_tokens_id") REFERENCES "public"."login_tokens"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_course_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("course_groups_id");
  CREATE INDEX "payload_locked_documents_rels_login_tokens_id_idx" ON "payload_locked_documents_rels" USING btree ("login_tokens_id");`)

  // Existing accounts (all staff so far): split "Vezetéknév Keresztnév" (family name first), keep
  // them verified so they can still log in, and map the old single role (editor → staff).
  await db.execute(sql`
  UPDATE "users" SET
    "last_name" = split_part(coalesce(nullif(trim("name"), ''), "email"), ' ', 1),
    "first_name" = coalesce(nullif(trim(substr(trim("name"), length(split_part(trim("name"), ' ', 1)) + 1)), ''), '-'),
    "_verified" = true;
  ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;
  ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;
  INSERT INTO "users_roles" ("order", "parent_id", "value")
    SELECT 1, "id", (CASE WHEN "role" = 'admin' THEN 'admin' ELSE 'staff' END)::"enum_users_roles" FROM "users";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_groups_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "login_tokens" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "course_groups" CASCADE;
  DROP TABLE "course_groups_rels" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "login_tokens" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_course_groups_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_login_tokens_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_course_groups_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_login_tokens_id_idx";
  UPDATE "users" SET "name" = coalesce("name", concat_ws(' ', "last_name", "first_name"));
  ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "users" DROP COLUMN "last_name";
  ALTER TABLE "users" DROP COLUMN "first_name";
  ALTER TABLE "users" DROP COLUMN "phone";
  ALTER TABLE "users" DROP COLUMN "_verified";
  ALTER TABLE "users" DROP COLUMN "_verificationtoken";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "course_groups_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "login_tokens_id";
  DROP TYPE "public"."enum_course_groups_type";
  DROP TYPE "public"."enum_users_roles";`)
}
