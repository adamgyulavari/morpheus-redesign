import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The "Vendég" role: accounts made by registering, a sign-up or a ticket start as guests; joining a
// course group makes a student (payload/access.ts). Nothing is live yet, so no account changes.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_roles" ADD VALUE 'guest';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "users_roles" SET "value" = 'student' WHERE "value" = 'guest';
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'staff', 'student');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";`)
}
