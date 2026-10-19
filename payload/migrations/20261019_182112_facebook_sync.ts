import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "shows" ADD COLUMN "facebook_event_id" varchar;
  ALTER TABLE "shows" ADD COLUMN "hidden" boolean DEFAULT false;
  CREATE UNIQUE INDEX "shows_facebook_event_id_idx" ON "shows" USING btree ("facebook_event_id");
  CREATE INDEX "shows_hidden_idx" ON "shows" USING btree ("hidden");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "shows_facebook_event_id_idx";
  DROP INDEX "shows_hidden_idx";
  ALTER TABLE "shows" DROP COLUMN "facebook_event_id";
  ALTER TABLE "shows" DROP COLUMN "hidden";`)
}
