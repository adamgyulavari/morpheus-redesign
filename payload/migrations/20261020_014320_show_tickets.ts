import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// A show booking's tickets: one per seat, each with its code (its QR code leads to /jegy/<code>),
// and when / by whom it was used at the door. The e-mails caption each ticket's QR code.

const TICKET_TEXTS = {
  ticket: 'Jegy',
  ticketWhen: 'Mikor',
  ticketWhere: 'Hol',
  ticketName: 'Név',
  ticketOf: '{n}. jegy ({of} közül)',
  ticketValid: 'Érvényes jegy',
  ticketUsed: 'Ezt a jegyet már felhasználták: {time}',
  ticketUsedShort: 'felhasználva',
  ticketInvalid: 'Ez a jegy nem érvényes.',
  ticketShow: 'Mutasd fel a bejáratnál.',
  ticketUse: 'Jegy felhasználása',
  ticketDone: 'Beengedve — jó szórakozást!',
  ticketUsedAlready: 'Ezt a jegyet már felhasználták.',
  myTickets: 'Jegyeim',
  myTicketsIntro: 'A bejáratnál mutasd fel a QR-kódokat, jegyenként egyet. A levélben is megvannak.',
};

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "applications_tickets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar,
  	"used_at" timestamp(3) with time zone,
  	"used_by_id" integer
  );
  
  ALTER TABLE "email_texts" ADD COLUMN "common_label_ticket" varchar NOT NULL DEFAULT '{n}. jegy';
  ALTER TABLE "email_texts" ALTER COLUMN "common_label_ticket" DROP DEFAULT;
  ALTER TABLE "applications_tickets" ADD CONSTRAINT "applications_tickets_used_by_id_users_id_fk" FOREIGN KEY ("used_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "applications_tickets" ADD CONSTRAINT "applications_tickets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "applications_tickets_order_idx" ON "applications_tickets" USING btree ("_order");
  CREATE INDEX "applications_tickets_parent_id_idx" ON "applications_tickets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "applications_tickets_code_idx" ON "applications_tickets" USING btree ("code");
  CREATE INDEX "applications_tickets_used_by_idx" ON "applications_tickets" USING btree ("used_by_id");`)
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{showBooking}', coalesce("texts"->'showBooking', '{}'::jsonb) || ${JSON.stringify(TICKET_TEXTS)}::jsonb, true)
  WHERE "lang" = 'hu';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{showBooking}', ("texts"->'showBooking') - ${sql.raw(`ARRAY[${Object.keys(TICKET_TEXTS).map((k) => `'${k}'`).join(', ')}]`)}, true)
  WHERE "lang" = 'hu';`)
  await db.execute(sql`
   DROP TABLE "applications_tickets" CASCADE;
  ALTER TABLE "email_texts" DROP COLUMN "common_label_ticket";`)
}
