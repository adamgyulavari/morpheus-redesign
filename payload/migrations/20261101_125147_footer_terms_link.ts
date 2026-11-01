import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The footer's ÁSZF link, next to the privacy one: the existing row gets the /aszf page (the
// default fills it, then goes, so the wording stays in the admin).
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "terms_label" varchar DEFAULT 'Általános Szerződési Feltételek' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "terms_href" varchar DEFAULT '/aszf' NOT NULL;
  ALTER TABLE "site_settings" ALTER COLUMN "terms_label" DROP DEFAULT;
  ALTER TABLE "site_settings" ALTER COLUMN "terms_href" DROP DEFAULT;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "terms_label";
  ALTER TABLE "site_settings" DROP COLUMN "terms_href";`)
}
