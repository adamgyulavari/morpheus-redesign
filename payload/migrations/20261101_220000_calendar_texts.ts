import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Felületi szövegek: /fiokom's "Naptár" box (subscribing to the calendar feed) and the "Naptárba"
// link of an item. A data change in the `hu` document.
const overview = JSON.stringify({
  calendar: 'Naptár',
  calendarText:
    'Iratkozz fel a saját naptáradban: az óráid, próbáid, foglalásaid és jegyeid maguktól megjelennek, és frissülnek, ha valami változik. A link személyes — ne oszd meg.',
  calendarGoogle: 'Google Naptár',
  calendarApple: 'Apple / Outlook',
  calendarCopy: 'Link másolása',
  calendarCopied: 'Másolva ✓',
});
const upcoming = JSON.stringify({ addToCalendar: 'Naptárba' });

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{overview}', coalesce("texts"->'overview', '{}') || ${overview}::jsonb, true)
  WHERE "lang" = 'hu';`);
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{upcoming}', coalesce("texts"->'upcoming', '{}') || ${upcoming}::jsonb, true)
  WHERE "lang" = 'hu';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{overview}', ("texts"->'overview') - 'calendar' - 'calendarText' - 'calendarGoogle' - 'calendarApple' - 'calendarCopy' - 'calendarCopied', true)
  WHERE "lang" = 'hu';`);
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{upcoming}', ("texts"->'upcoming') - 'addToCalendar', true)
  WHERE "lang" = 'hu';`);
}
