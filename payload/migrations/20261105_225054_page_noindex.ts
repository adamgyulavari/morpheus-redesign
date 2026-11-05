import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "noindex" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_noindex" boolean DEFAULT false;`)
  // the link-in-bio page is only for Instagram
  await db.execute(sql`
   UPDATE "pages" SET "noindex" = true WHERE "path" = '/bio';
   UPDATE "_pages_v" SET "version_noindex" = true
   WHERE "latest" AND "parent_id" IN (SELECT "id" FROM "pages" WHERE "path" = '/bio');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "noindex";
  ALTER TABLE "_pages_v" DROP COLUMN "version_noindex";`)
}
