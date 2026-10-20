import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Felületi szövegek: the texts of booking a show on the site (payload/ui-catalogue.ts showBooking),
// their first Hungarian wording. A data change: the `hu` document gets the group.
const SHOW_BOOKING = {
  seats: 'Jegyek száma',
  free: 'Ingyenes, regisztrációval',
  perTicket: '{price} / jegy',
  submit: 'Helyet foglalok',
  done: 'Köszönjük, lefoglaltuk a helyed! A visszaigazolást e-mailben küldtük.',
  track: 'A foglalásodat a fiókodban látod, és ha mégsem tudsz jönni, ott le is mondhatod.',
  title: 'Jegyvásárlás',
  noRefund: 'A megvásárolt jegyet nem lehet lemondani; ha mégsem tudsz jönni, írj nekünk.',
  closed: 'Erre az előadásra már nem lehet jegyet venni.',
  back: 'Vissza az előadáshoz',
  loginAfter: ', és egy kattintással foglalhatsz. Ha nincs, a foglalással létrehozzuk.',
  checkoutLoginAfter: ', és kitöltjük helyetted. Ha nincs, a vásárlással létrehozzuk.',
  terms: 'A jegyvásárláshoz el kell fogadnod az ÁSZF-et.',
  orderHeading: '*Jegyvásárlás*',
  orderCancelled: 'Megszakítottad a jegyvásárlást',
  orderAgain: 'Mégis kérem a jegyeket',
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "ui_texts" SET "texts" = jsonb_set("texts", '{showBooking}', ${JSON.stringify(SHOW_BOOKING)}::jsonb, true)
  WHERE "lang" = 'hu';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`UPDATE "ui_texts" SET "texts" = "texts" - 'showBooking' WHERE "lang" = 'hu';`);
}
