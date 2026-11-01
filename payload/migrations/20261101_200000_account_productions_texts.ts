import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Felületi szövegek: /fiokom's "Darabjaim" and "Korábbi kurzusaim" headings. A data change in the
// `hu` document.
const texts = JSON.stringify({ productions: 'Darabjaim', pastCourses: 'Korábbi kurzusaim' });

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{overview}', coalesce("texts"->'overview', '{}') || ${texts}::jsonb, true)
  WHERE "lang" = 'hu';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{overview}', ("texts"->'overview') - 'productions' - 'pastCourses', true)
  WHERE "lang" = 'hu';`);
}
