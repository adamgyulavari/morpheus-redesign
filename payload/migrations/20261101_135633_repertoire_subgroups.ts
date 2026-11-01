import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The students' plays get two subgroups on the repertoire: the classics (Bernarda Alba háza,
// Vízkereszt) and their own pieces. Every production gets one (only the students' show it); the
// two plays move over, and the students' section of the repertoire page (and its latest version)
// gets the two parts, its heading and intro following the new layout.
const CLASSICS = ['bernarda-alba-haza', 'vizkereszt']
const PARTS = [
  {
    subgroup: 'classics',
    heading: 'Klasszikusok',
    intro: 'Halhatatlan klasszikusok a Morpheus Színműhely hallgatóinak előadásában.',
  },
  {
    subgroup: 'own',
    heading: 'Saját készítésű előadások',
    intro: 'Az alábbi előadásokat hallgatóink hozták létre és ők is viszik színre.',
  },
]
const OLD_STUDENTS = {
  heading: 'Hallgatóink saját alkotásai',
  intro: 'Ezeket az előadásokat hallgatóink hozták létre, és ők viszik színpadra.',
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_repertoire_groups_subgroups_subgroup" AS ENUM('classics', 'own');
  CREATE TYPE "public"."enum__pages_v_blocks_repertoire_groups_subgroups_subgroup" AS ENUM('classics', 'own');
  CREATE TYPE "public"."enum_productions_subgroup" AS ENUM('classics', 'own');
  CREATE TYPE "public"."enum__productions_v_version_subgroup" AS ENUM('classics', 'own');
  CREATE TABLE "pages_blocks_repertoire_groups_subgroups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"subgroup" "enum_pages_blocks_repertoire_groups_subgroups_subgroup",
  	"heading" varchar,
  	"intro" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_repertoire_groups_subgroups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"subgroup" "enum__pages_v_blocks_repertoire_groups_subgroups_subgroup",
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "productions" ADD COLUMN "subgroup" "enum_productions_subgroup" DEFAULT 'own';
  ALTER TABLE "_productions_v" ADD COLUMN "version_subgroup" "enum__productions_v_version_subgroup" DEFAULT 'own';
  ALTER TABLE "pages_blocks_repertoire_groups_subgroups" ADD CONSTRAINT "pages_blocks_repertoire_groups_subgroups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_repertoire_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_repertoire_groups_subgroups" ADD CONSTRAINT "_pages_v_blocks_repertoire_groups_subgroups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_repertoire_groups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_repertoire_groups_subgroups_order_idx" ON "pages_blocks_repertoire_groups_subgroups" USING btree ("_order");
  CREATE INDEX "pages_blocks_repertoire_groups_subgroups_parent_id_idx" ON "pages_blocks_repertoire_groups_subgroups" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_repertoire_groups_subgroups_order_idx" ON "_pages_v_blocks_repertoire_groups_subgroups" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_repertoire_groups_subgroups_parent_id_idx" ON "_pages_v_blocks_repertoire_groups_subgroups" USING btree ("_parent_id");`)

  const slugs = sql.join(CLASSICS.map((slug) => sql`${slug}`), sql`, `)
  await db.execute(sql`UPDATE "productions" SET "subgroup" = 'classics' WHERE "slug" IN (${slugs})`)
  await db.execute(sql`UPDATE "_productions_v" SET "version_subgroup" = 'classics' WHERE "version_slug" IN (${slugs})`)

  for (const table of ['pages_blocks_repertoire_groups', '_pages_v_blocks_repertoire_groups']) {
    await db.execute(sql`
    UPDATE ${sql.identifier(table)} SET "heading" = 'Nagyszínpadi produkciók'
    WHERE "group" = 'company' AND "heading" = 'Társulati előadások'`)
    await db.execute(sql`
    UPDATE ${sql.identifier(table)} SET "heading" = 'Hallgatói előadások', "intro" = NULL
    WHERE "group" = 'students'`)
  }

  for (const [i, part] of PARTS.entries()) {
    await db.execute(sql`
    INSERT INTO "pages_blocks_repertoire_groups_subgroups" ("_order", "_parent_id", "id", "subgroup", "heading", "intro")
    SELECT ${i + 1}, g."id", substr(md5(random()::text), 1, 24), ${part.subgroup}, ${part.heading}, ${part.intro}
    FROM "pages_blocks_repertoire_groups" g WHERE g."group" = 'students'`)
    await db.execute(sql`
    INSERT INTO "_pages_v_blocks_repertoire_groups_subgroups" ("_order", "_parent_id", "subgroup", "heading", "intro", "_uuid")
    SELECT ${i + 1}, g."id", ${part.subgroup}, ${part.heading}, ${part.intro}, substr(md5(random()::text), 1, 24)
    FROM "_pages_v_blocks_repertoire_groups" g
    JOIN "_pages_v_blocks_repertoire" b ON b."id" = g."_parent_id" JOIN "_pages_v" v ON v."id" = b."_parent_id"
    WHERE v."latest" AND g."group" = 'students'`)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  for (const table of ['pages_blocks_repertoire_groups', '_pages_v_blocks_repertoire_groups']) {
    await db.execute(sql`
    UPDATE ${sql.identifier(table)} SET "heading" = ${OLD_STUDENTS.heading}, "intro" = ${OLD_STUDENTS.intro}
    WHERE "group" = 'students'`)
    await db.execute(sql`
    UPDATE ${sql.identifier(table)} SET "heading" = 'Társulati előadások'
    WHERE "group" = 'company' AND "heading" = 'Nagyszínpadi produkciók'`)
  }
  await db.execute(sql`
   DROP TABLE "pages_blocks_repertoire_groups_subgroups" CASCADE;
  DROP TABLE "_pages_v_blocks_repertoire_groups_subgroups" CASCADE;
  ALTER TABLE "productions" DROP COLUMN "subgroup";
  ALTER TABLE "_productions_v" DROP COLUMN "version_subgroup";
  DROP TYPE "public"."enum_pages_blocks_repertoire_groups_subgroups_subgroup";
  DROP TYPE "public"."enum__pages_v_blocks_repertoire_groups_subgroups_subgroup";
  DROP TYPE "public"."enum_productions_subgroup";
  DROP TYPE "public"."enum__productions_v_version_subgroup";`)
}
