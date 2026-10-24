import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_home_hero_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_home_hero_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_blocks_home_hero" DROP CONSTRAINT "pages_blocks_home_hero_image_large_id_media_id_fk";
  
  ALTER TABLE "pages_blocks_home_hero" DROP CONSTRAINT "pages_blocks_home_hero_image_small_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_home_hero" DROP CONSTRAINT "_pages_v_blocks_home_hero_image_large_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_home_hero" DROP CONSTRAINT "_pages_v_blocks_home_hero_image_small_id_media_id_fk";
  
  DROP INDEX "pages_blocks_home_hero_image_large_idx";
  DROP INDEX "pages_blocks_home_hero_image_small_idx";
  DROP INDEX "_pages_v_blocks_home_hero_image_large_idx";
  DROP INDEX "_pages_v_blocks_home_hero_image_small_idx";
  ALTER TABLE "pages_blocks_home_hero_photos" ADD CONSTRAINT "pages_blocks_home_hero_photos_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_hero_photos" ADD CONSTRAINT "pages_blocks_home_hero_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_hero_photos" ADD CONSTRAINT "_pages_v_blocks_home_hero_photos_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_hero_photos" ADD CONSTRAINT "_pages_v_blocks_home_hero_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_home_hero"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_home_hero_photos_order_idx" ON "pages_blocks_home_hero_photos" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_hero_photos_parent_id_idx" ON "pages_blocks_home_hero_photos" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_hero_photos_photo_idx" ON "pages_blocks_home_hero_photos" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_home_hero_photos_order_idx" ON "_pages_v_blocks_home_hero_photos" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_hero_photos_parent_id_idx" ON "_pages_v_blocks_home_hero_photos" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_hero_photos_photo_idx" ON "_pages_v_blocks_home_hero_photos" USING btree ("photo_id");
  -- the two round photos stay, as the first two of the list (the editors replace them in the admin)
  INSERT INTO "pages_blocks_home_hero_photos" ("_order", "_parent_id", "id", "photo_id")
    SELECT n, "id", substr(md5(random()::text), 1, 24), photo FROM "pages_blocks_home_hero",
      LATERAL (VALUES (1, "image_large_id"), (2, "image_small_id")) AS p(n, photo)
    WHERE photo IS NOT NULL;
  INSERT INTO "_pages_v_blocks_home_hero_photos" ("_order", "_parent_id", "photo_id", "_uuid")
    SELECT n, "id", photo, substr(md5(random()::text), 1, 24) FROM "_pages_v_blocks_home_hero",
      LATERAL (VALUES (1, "image_large_id"), (2, "image_small_id")) AS p(n, photo)
    WHERE photo IS NOT NULL;
  ALTER TABLE "pages_blocks_home_hero" DROP COLUMN "image_large_id";
  ALTER TABLE "pages_blocks_home_hero" DROP COLUMN "image_small_id";
  ALTER TABLE "_pages_v_blocks_home_hero" DROP COLUMN "image_large_id";
  ALTER TABLE "_pages_v_blocks_home_hero" DROP COLUMN "image_small_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_home_hero" ADD COLUMN "image_large_id" integer;
  ALTER TABLE "pages_blocks_home_hero" ADD COLUMN "image_small_id" integer;
  ALTER TABLE "_pages_v_blocks_home_hero" ADD COLUMN "image_large_id" integer;
  ALTER TABLE "_pages_v_blocks_home_hero" ADD COLUMN "image_small_id" integer;
  UPDATE "pages_blocks_home_hero" h SET
    "image_large_id" = (SELECT "photo_id" FROM "pages_blocks_home_hero_photos" WHERE "_parent_id" = h."id" ORDER BY "_order" LIMIT 1),
    "image_small_id" = (SELECT "photo_id" FROM "pages_blocks_home_hero_photos" WHERE "_parent_id" = h."id" ORDER BY "_order" OFFSET 1 LIMIT 1);
  UPDATE "_pages_v_blocks_home_hero" h SET
    "image_large_id" = (SELECT "photo_id" FROM "_pages_v_blocks_home_hero_photos" WHERE "_parent_id" = h."id" ORDER BY "_order" LIMIT 1),
    "image_small_id" = (SELECT "photo_id" FROM "_pages_v_blocks_home_hero_photos" WHERE "_parent_id" = h."id" ORDER BY "_order" OFFSET 1 LIMIT 1);
  ALTER TABLE "pages_blocks_home_hero_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_home_hero_photos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_home_hero_photos" CASCADE;
  DROP TABLE "_pages_v_blocks_home_hero_photos" CASCADE;
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_image_large_id_media_id_fk" FOREIGN KEY ("image_large_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_image_small_id_media_id_fk" FOREIGN KEY ("image_small_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_hero" ADD CONSTRAINT "_pages_v_blocks_home_hero_image_large_id_media_id_fk" FOREIGN KEY ("image_large_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_hero" ADD CONSTRAINT "_pages_v_blocks_home_hero_image_small_id_media_id_fk" FOREIGN KEY ("image_small_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_home_hero_image_large_idx" ON "pages_blocks_home_hero" USING btree ("image_large_id");
  CREATE INDEX "pages_blocks_home_hero_image_small_idx" ON "pages_blocks_home_hero" USING btree ("image_small_id");
  CREATE INDEX "_pages_v_blocks_home_hero_image_large_idx" ON "_pages_v_blocks_home_hero" USING btree ("image_large_id");
  CREATE INDEX "_pages_v_blocks_home_hero_image_small_idx" ON "_pages_v_blocks_home_hero" USING btree ("image_small_id");`)
}
