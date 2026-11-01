import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Felületi szövegek: the repertoire filter's company chip follows the group's new name. A data
// change in the `hu` document.
const label = (company: string) => JSON.stringify({ company });

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{repertoire}', coalesce("texts"->'repertoire', '{}') || ${label('Nagyszínpadi produkciók')}::jsonb, true)
  WHERE "lang" = 'hu';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{repertoire}', coalesce("texts"->'repertoire', '{}') || ${label('Társulati előadások')}::jsonb, true)
  WHERE "lang" = 'hu';`);
}
