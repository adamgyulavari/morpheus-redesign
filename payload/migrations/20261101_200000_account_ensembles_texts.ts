import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Felületi szövegek: /fiokom's "Társulat és darabok" and "Korábbi kurzusaim" sections and a group's
// shows. A data change in the `hu` document.
const texts = JSON.stringify({
  ensembles: 'Társulat és darabok',
  plays: 'Darab: {shows}',
  pastCourses: 'Korábbi kurzusaim',
});

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{overview}', coalesce("texts"->'overview', '{}') || ${texts}::jsonb, true)
  WHERE "lang" = 'hu';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{overview}', ("texts"->'overview') - 'ensembles' - 'plays' - 'pastCourses', true)
  WHERE "lang" = 'hu';`);
}
