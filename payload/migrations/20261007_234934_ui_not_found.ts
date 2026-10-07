import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The ui global already has a row: add the columns, fill them with the default texts, then
  // make them required (a plain NOT NULL column can't be added to a table that has rows).
  await db.execute(sql`
  ALTER TABLE "ui" ADD COLUMN "not_found_title" varchar;
  ALTER TABLE "ui" ADD COLUMN "not_found_eyebrow" varchar;
  ALTER TABLE "ui" ADD COLUMN "not_found_heading" varchar;
  ALTER TABLE "ui" ADD COLUMN "not_found_text" varchar;
  ALTER TABLE "ui" ADD COLUMN "not_found_primary_label" varchar;
  ALTER TABLE "ui" ADD COLUMN "not_found_primary_href" varchar;
  ALTER TABLE "ui" ADD COLUMN "not_found_secondary_label" varchar;
  ALTER TABLE "ui" ADD COLUMN "not_found_secondary_href" varchar;
  UPDATE "ui" SET
    "not_found_title" = 'Az oldal nem található — Morpheus Színműhely',
    "not_found_eyebrow" = '404 · Az oldal nem található',
    "not_found_heading" = 'Ez a jelenet *nincs a darabban.*',
    "not_found_text" = 'Az oldal, amit keresel, nem létezik, vagy közben máshová költözött. Kezdd újra a nyitóoldalon, vagy nézd meg, mikor játszunk legközelebb.',
    "not_found_primary_label" = 'Vissza a nyitóoldalra',
    "not_found_primary_href" = '/',
    "not_found_secondary_label" = 'Közelgő előadások',
    "not_found_secondary_href" = '/kozelgo-eloadasok';
  ALTER TABLE "ui" ALTER COLUMN "not_found_title" SET NOT NULL;
  ALTER TABLE "ui" ALTER COLUMN "not_found_eyebrow" SET NOT NULL;
  ALTER TABLE "ui" ALTER COLUMN "not_found_heading" SET NOT NULL;
  ALTER TABLE "ui" ALTER COLUMN "not_found_text" SET NOT NULL;
  ALTER TABLE "ui" ALTER COLUMN "not_found_primary_label" SET NOT NULL;
  ALTER TABLE "ui" ALTER COLUMN "not_found_primary_href" SET NOT NULL;
  ALTER TABLE "ui" ALTER COLUMN "not_found_secondary_label" SET NOT NULL;
  ALTER TABLE "ui" ALTER COLUMN "not_found_secondary_href" SET NOT NULL;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ui" DROP COLUMN "not_found_title";
  ALTER TABLE "ui" DROP COLUMN "not_found_eyebrow";
  ALTER TABLE "ui" DROP COLUMN "not_found_heading";
  ALTER TABLE "ui" DROP COLUMN "not_found_text";
  ALTER TABLE "ui" DROP COLUMN "not_found_primary_label";
  ALTER TABLE "ui" DROP COLUMN "not_found_primary_href";
  ALTER TABLE "ui" DROP COLUMN "not_found_secondary_label";
  ALTER TABLE "ui" DROP COLUMN "not_found_secondary_href";`)
}
