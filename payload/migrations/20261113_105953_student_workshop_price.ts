import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Jelentkezési beállítások: the students' discount on Nyitott Műhely; Felületi szövegek: its line at the checkout.
const checkout = JSON.stringify({ studentPrice: 'Hallgatói ár (−{percent}%)' });

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "application_settings" ADD COLUMN "student_discount_percent" numeric DEFAULT 50 NOT NULL;`);
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{checkout}', coalesce("texts"->'checkout', '{}') || ${checkout}::jsonb, true)
  WHERE "lang" = 'hu';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "application_settings" DROP COLUMN "student_discount_percent";`);
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{checkout}', ("texts"->'checkout') - 'studentPrice', true)
  WHERE "lang" = 'hu';`);
}
