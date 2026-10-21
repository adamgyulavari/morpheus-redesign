import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// "Folytatás Google-fiókkal": the Google account's id on the user (set at its first login), and the
// texts of the button (Felületi szövegek → googleLogin), their first Hungarian wording.
const GOOGLE_LOGIN = {
  button: 'Folytatás Google-fiókkal',
  or: 'vagy',
  consent: 'A folytatással elfogadod az <link>adatkezelési tájékoztatót</link>.',
  cancelled: 'Megszakítottad a Google-belépést. Próbáld újra, vagy lépj be az e-mail-címeddel.',
  failed: 'A Google-belépés nem sikerült. Próbáld újra.',
  unverified:
    'A Google-fiókodban nincs megerősített e-mail-cím, ezért nem tudunk vele beléptetni. Lépj be az e-mail-címeddel.',
  linked: 'Google-fiók csatolva',
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "users" ADD COLUMN "google_sub" varchar;
  CREATE UNIQUE INDEX "users_google_sub_idx" ON "users" USING btree ("google_sub");`);
  // with a parameter: a statement of its own
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{googleLogin}', ${JSON.stringify(GOOGLE_LOGIN)}::jsonb, true)
  WHERE "lang" = 'hu';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = "texts" - 'googleLogin' WHERE "lang" = 'hu';
  DROP INDEX "users_google_sub_idx";
  ALTER TABLE "users" DROP COLUMN "google_sub";`);
}
