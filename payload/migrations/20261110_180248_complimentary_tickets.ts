import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Tiszteletjegy: staff give free tickets to a show booked on the site. The booking's mark, and the
// guest's e-mail with its first wording (the defaults fill the one E-mailek row, then are dropped).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "applications" ADD COLUMN "complimentary" boolean DEFAULT false;
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_complimentary_subject" varchar NOT NULL DEFAULT 'Tiszteletjegy: {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_complimentary_preheader" varchar DEFAULT '{mikor} · {hol}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_complimentary_heading" varchar NOT NULL DEFAULT 'Tiszteletjegyet kaptál';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_complimentary_text" varchar NOT NULL DEFAULT 'Szeretettel meghívunk az előadásunkra: {jegyek} tiszteletjegyet foglaltunk neked. A jegyeidet ebben a levélben találod, a bejáratnál mutasd fel őket.

Ha mégsem tudsz jönni, a fiókodban lemondhatod, hogy másnak is jusson hely.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_complimentary_button" varchar NOT NULL DEFAULT 'Fiókom';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_complimentary_account_created" varchar DEFAULT 'Fiókod elkészült — a lenti gombbal belépve itt is látod a jegyeidet.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_complimentary_account_existing" varchar DEFAULT 'A jegyeidet a fiókodban is látod.';
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_complimentary_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_complimentary_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_complimentary_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_complimentary_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_complimentary_button" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_complimentary_account_created" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_complimentary_account_existing" DROP DEFAULT;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "applications" DROP COLUMN "complimentary";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_complimentary_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_complimentary_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_complimentary_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_complimentary_text";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_complimentary_button";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_complimentary_account_created";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_complimentary_account_existing";`);
}
