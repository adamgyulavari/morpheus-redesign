import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Shows can be booked on the site (Jegyfoglalás → Saját foglalás): free registration or tickets,
// through the Nyitott Műhely machinery — a booking is an application of the new kind "show" with
// its seats, a ticket is an order of kind "show". The defaults (price, seats, the most seats per
// booking) are in Fizetési beállítások; E-mailek gets a Jegyfoglalás tab (a show's own e-mails,
// about tickets rather than sign-ups).
//
// The one-active-application guards: a person has one active booking per show (with its seats);
// the "one open application without a group" guard is for the course kinds only (a show booking
// has no group either). The new enum values aren't used here: they can't be in the transaction
// that adds them.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_shows_booking_mode" AS ENUM('external', 'internal');
  ALTER TYPE "public"."enum_orders_kind" ADD VALUE 'show' BEFORE 'monthlyFee';
  ALTER TYPE "public"."enum_applications_kind" ADD VALUE 'show';
  ALTER TABLE "shows" ADD COLUMN "booking_mode" "enum_shows_booking_mode" DEFAULT 'external' NOT NULL;
  ALTER TABLE "shows" ADD COLUMN "booking_price" numeric;
  ALTER TABLE "shows" ADD COLUMN "booking_seats" numeric;
  ALTER TABLE "shows" ADD COLUMN "booking_open" boolean DEFAULT true;
  ALTER TABLE "shows" ADD COLUMN "code" varchar;
  ALTER TABLE "applications" ADD COLUMN "show_id" integer;
  ALTER TABLE "applications" ADD COLUMN "seats" numeric DEFAULT 1;
  ALTER TABLE "billing_settings" ADD COLUMN "show_defaults_price" numeric DEFAULT 3500 NOT NULL;
  ALTER TABLE "billing_settings" ADD COLUMN "show_defaults_seats" numeric DEFAULT 30 NOT NULL;
  ALTER TABLE "billing_settings" ADD COLUMN "show_defaults_max_per_booking" numeric DEFAULT 10 NOT NULL;
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_booked_subject" varchar NOT NULL DEFAULT 'Jegyfoglalás: {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_booked_preheader" varchar DEFAULT '{mikor} · {hol}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_booked_heading" varchar NOT NULL DEFAULT 'Lefoglaltuk a jegyed';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_booked_text" varchar NOT NULL DEFAULT 'Köszönjük, lefoglaltuk a helyed ({jegyek} jegy). Várunk szeretettel!

Ha mégsem tudsz jönni, a fiókodban lemondhatod a foglalást, hogy másnak is jusson hely.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_booked_button" varchar NOT NULL DEFAULT 'Fiókom';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_booked_account_created" varchar DEFAULT 'Fiókod elkészült — a lenti gombbal belépve itt látod a jegyfoglalásodat.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_booked_account_existing" varchar DEFAULT 'A jegyfoglalásodat a fiókodban látod.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_payment_link_subject" varchar NOT NULL DEFAULT 'Jegyvásárlás: {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_payment_link_preheader" varchar DEFAULT 'A jegyeidet {hatarido}-ig tartjuk.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_payment_link_heading" varchar NOT NULL DEFAULT 'Már csak a fizetés van hátra';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_payment_link_text" varchar NOT NULL DEFAULT 'Félretettük a jegyeidet ({jegyek} jegy); a fizetéssel lesznek a tieid. {hatarido}-ig tartjuk őket.

Ha a fizetési oldal bezárult vagy a fizetés megszakadt, ezen a linken folytathatod — később is, amíg van szabad hely. Ha már fizettél, a link a fizetés állapotát mutatja.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_payment_link_button" varchar NOT NULL DEFAULT 'Fizetés';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_paid_subject" varchar NOT NULL DEFAULT 'Jegyek: {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_paid_preheader" varchar DEFAULT '{mikor} · {hol}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_paid_heading" varchar NOT NULL DEFAULT 'Megvannak a jegyeid';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_paid_text" varchar NOT NULL DEFAULT 'Köszönjük, a fizetés rendben megérkezett: {jegyek} jegyet foglaltunk neked. Várunk szeretettel!

A jegyfoglalásodat a fiókodban is látod.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_paid_button" varchar NOT NULL DEFAULT 'Fiókom';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_paid_calendar_note" varchar DEFAULT 'A naptáradba a mellékelt fájllal veheted fel.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_self_subject" varchar NOT NULL DEFAULT 'Lemondva: {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_self_preheader" varchar DEFAULT '{mikor}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_self_heading" varchar NOT NULL DEFAULT 'Lemondtad a jegyfoglalásodat';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_self_text" varchar NOT NULL DEFAULT 'Rögzítettük a lemondásod, a helyeket felszabadítottuk. Reméljük, legközelebb találkozunk!';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_self_button" varchar NOT NULL DEFAULT 'Fiókom';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_staff_subject" varchar NOT NULL DEFAULT 'Lemondva: {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_staff_preheader" varchar DEFAULT '{mikor}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_staff_heading" varchar NOT NULL DEFAULT 'Lemondtuk a jegyfoglalásodat';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_staff_text" varchar NOT NULL DEFAULT 'A jegyfoglalásodat lemondtuk. Ha kérdésed van, írj nekünk.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_ticket_cancelled_by_staff_button" varchar NOT NULL DEFAULT 'Fiókom';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_booked_subject" varchar NOT NULL DEFAULT 'Új jegyfoglalás: {nev} — {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_booked_preheader" varchar DEFAULT '{jegyek} jegy · {mikor}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_booked_heading" varchar NOT NULL DEFAULT 'Új jegyfoglalás';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_booked_text" varchar NOT NULL DEFAULT '{nev} ({email}) {jegyek} jegyet foglalt.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_booked_button" varchar NOT NULL DEFAULT 'Megnyitás az adminban';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_paid_subject" varchar NOT NULL DEFAULT 'Új jegyvásárlás: {nev} — {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_paid_preheader" varchar DEFAULT '{nev}, {osszeg}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_paid_heading" varchar NOT NULL DEFAULT 'Új jegyvásárlás';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_paid_text" varchar NOT NULL DEFAULT '{nev} ({email}) {jegyek} jegyet vett.';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_paid_button" varchar NOT NULL DEFAULT 'Jelentkezések';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_cancelled_subject" varchar NOT NULL DEFAULT 'Lemondott jegyfoglalás: {nev} — {cim}, {mikor}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_cancelled_preheader" varchar DEFAULT '{nev} — {cim}';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_cancelled_heading" varchar NOT NULL DEFAULT 'Egy néző lemondta';
  ALTER TABLE "email_texts" ADD COLUMN "tickets_staff_ticket_cancelled_text" varchar NOT NULL DEFAULT '{nev} lemondta a jegyfoglalását ({jegyek} jegy).';
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_booked_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_booked_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_booked_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_booked_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_booked_button" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_booked_account_created" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_booked_account_existing" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_payment_link_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_payment_link_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_payment_link_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_payment_link_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_payment_link_button" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_paid_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_paid_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_paid_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_paid_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_paid_button" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_paid_calendar_note" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_self_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_self_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_self_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_self_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_self_button" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_staff_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_staff_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_staff_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_staff_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_ticket_cancelled_by_staff_button" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_booked_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_booked_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_booked_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_booked_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_booked_button" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_paid_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_paid_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_paid_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_paid_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_paid_button" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_cancelled_subject" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_cancelled_preheader" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_cancelled_heading" DROP DEFAULT;
  ALTER TABLE "email_texts" ALTER COLUMN "tickets_staff_ticket_cancelled_text" DROP DEFAULT;
  ALTER TABLE "email_texts" ADD COLUMN "common_label_seats" varchar NOT NULL DEFAULT 'Jegyek';
  ALTER TABLE "email_texts" ALTER COLUMN "common_label_seats" DROP DEFAULT;
  ALTER TABLE "applications" ADD CONSTRAINT "applications_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "shows_code_idx" ON "shows" USING btree ("code");
  CREATE INDEX "applications_show_idx" ON "applications" USING btree ("show_id");
  CREATE UNIQUE INDEX "applications_one_active_per_show" ON "applications" ("user_id", "show_id")
    WHERE "show_id" IS NOT NULL AND "status" IN ('held', 'registered');
  DROP INDEX IF EXISTS "applications_one_open_without_group";
  CREATE UNIQUE INDEX "applications_one_open_without_group" ON "applications" ("user_id", "kind", COALESCE("course_id", 0))
    WHERE "kind" IN ('beginner', 'professional') AND "course_group_id" IS NULL AND "status" IN ('held', 'registered', 'new', 'interview');`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // the show bookings and tickets go first: the kinds can't shrink while they exist
  await db.execute(sql`
  DELETE FROM "orders" WHERE "kind" = 'show';
  DELETE FROM "applications" WHERE "kind" = 'show';
  DROP INDEX IF EXISTS "applications_one_active_per_show";
  DROP INDEX IF EXISTS "applications_one_open_without_group";
  ALTER TABLE "applications" DROP CONSTRAINT "applications_show_id_shows_id_fk";
  ALTER TABLE "orders" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_orders_kind";
  CREATE TYPE "public"."enum_orders_kind" AS ENUM('workshop', 'beginner', 'monthlyFee');
  ALTER TABLE "orders" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_orders_kind" USING "kind"::"public"."enum_orders_kind";
  ALTER TABLE "applications" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_applications_kind";
  CREATE TYPE "public"."enum_applications_kind" AS ENUM('workshop', 'beginner', 'professional');
  ALTER TABLE "applications" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_applications_kind" USING "kind"::"public"."enum_applications_kind";
  CREATE UNIQUE INDEX "applications_one_open_without_group" ON "applications" ("user_id", "kind", COALESCE("course_id", 0))
    WHERE "kind" <> 'workshop' AND "course_group_id" IS NULL AND "status" IN ('held', 'registered', 'new', 'interview');
  DROP INDEX "shows_code_idx";
  DROP INDEX "applications_show_idx";
  ALTER TABLE "shows" DROP COLUMN "booking_mode";
  ALTER TABLE "shows" DROP COLUMN "booking_price";
  ALTER TABLE "shows" DROP COLUMN "booking_seats";
  ALTER TABLE "shows" DROP COLUMN "booking_open";
  ALTER TABLE "shows" DROP COLUMN "code";
  ALTER TABLE "applications" DROP COLUMN "show_id";
  ALTER TABLE "applications" DROP COLUMN "seats";
  ALTER TABLE "billing_settings" DROP COLUMN "show_defaults_price";
  ALTER TABLE "billing_settings" DROP COLUMN "show_defaults_seats";
  ALTER TABLE "billing_settings" DROP COLUMN "show_defaults_max_per_booking";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_booked_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_booked_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_booked_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_booked_text";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_booked_button";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_booked_account_created";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_booked_account_existing";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_payment_link_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_payment_link_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_payment_link_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_payment_link_text";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_payment_link_button";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_paid_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_paid_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_paid_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_paid_text";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_paid_button";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_paid_calendar_note";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_self_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_self_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_self_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_self_text";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_self_button";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_staff_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_staff_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_staff_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_staff_text";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_ticket_cancelled_by_staff_button";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_booked_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_booked_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_booked_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_booked_text";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_booked_button";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_paid_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_paid_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_paid_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_paid_text";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_paid_button";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_cancelled_subject";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_cancelled_preheader";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_cancelled_heading";
  ALTER TABLE "email_texts" DROP COLUMN "tickets_staff_ticket_cancelled_text";
  ALTER TABLE "email_texts" DROP COLUMN "common_label_seats";
  DROP TYPE "public"."enum_shows_booking_mode";`);
}
