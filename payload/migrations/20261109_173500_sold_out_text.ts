import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Felületi szövegek: a sold-out show's "Teltház" mark. A data change in the `hu` document.
const shows = JSON.stringify({ soldOut: 'Teltház' });

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{shows}', coalesce("texts"->'shows', '{}') || ${shows}::jsonb, true)
  WHERE "lang" = 'hu';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{shows}', ("texts"->'shows') - 'soldOut', true)
  WHERE "lang" = 'hu';`);
}
