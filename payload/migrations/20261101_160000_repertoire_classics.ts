import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The repertoire gets a third group between the two: the students' classics (Bernarda Alba háza,
// Vízkereszt), apart from the pieces the students made themselves. The enums are rebuilt (a value
// added with ADD VALUE can't be used in the same transaction); the two plays move over, and every
// repertoire block (the page and its latest version) gets the new section, the headings follow the
// new names.
const ENUMS = [
  ['productions', 'group', 'enum_productions_group', 'company'],
  ['_productions_v', 'version_group', 'enum__productions_v_version_group', 'company'],
  ['pages_blocks_repertoire_groups', 'group', 'enum_pages_blocks_repertoire_groups_group', null],
  ['_pages_v_blocks_repertoire_groups', 'group', 'enum__pages_v_blocks_repertoire_groups_group', null],
] as const

const CLASSICS = ['bernarda-alba-haza', 'vizkereszt']

// a literal, not a parameter: a statement with parameters can't hold more than one command
const lit = (s: string) => sql.raw(`'${s.replaceAll("'", "''")}'`)

const SECTION = sql.join(
  ['Klasszikusok', 'Hallgatói előadások', 'Halhatatlan klasszikusok a Morpheus Színműhely hallgatóinak előadásában.'].map(lit),
  sql.raw(', '),
)

function rebuild(values: string[]) {
  return sql.join(
    ENUMS.map(([table, column, type, fallback]) => {
      const t = sql.raw(`"${table}"`)
      const c = sql.raw(`"${column}"`)
      const e = sql.raw(`"public"."${type}"`)
      const list = sql.raw(values.map((v) => `'${v}'`).join(', '))
      return sql`
  ALTER TABLE ${t} ALTER COLUMN ${c} SET DATA TYPE text;
  ${fallback ? sql.raw(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${fallback}'::text;`) : sql``}
  DROP TYPE ${e};
  CREATE TYPE ${e} AS ENUM(${list});
  ${fallback ? sql.raw(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${fallback}'::"public"."${type}";`) : sql``}
  ALTER TABLE ${t} ALTER COLUMN ${c} SET DATA TYPE ${e} USING ${c}::${e};`
    }),
    sql.raw(''),
  )
}

const slugs = sql.raw(CLASSICS.map((s) => `'${s}'`).join(', '))

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ${rebuild(['company', 'classics', 'students'])}

  UPDATE "productions" SET "group" = 'classics' WHERE "slug" IN (${slugs});
  UPDATE "_productions_v" SET "version_group" = 'classics' WHERE "version_slug" IN (${slugs});

  UPDATE "pages_blocks_repertoire_groups" SET "_order" = 3 WHERE "group" = 'students';
  INSERT INTO "pages_blocks_repertoire_groups" ("_order", "_parent_id", "id", "group", "eyebrow", "heading", "intro")
    SELECT 2, b."id", substr(md5(random()::text), 1, 24), 'classics', ${SECTION}
    FROM "pages_blocks_repertoire" b;
  UPDATE "pages_blocks_repertoire_groups" SET "heading" = 'Nagyszínpadi produkciók' WHERE "group" = 'company' AND "heading" = 'Társulati előadások';
  UPDATE "pages_blocks_repertoire_groups"
    SET "heading" = 'Hallgatóink saját előadásai', "intro" = 'Az alábbi előadásokat hallgatóink hozták létre és ők is viszik színre.'
    WHERE "group" = 'students' AND "heading" = 'Hallgatóink saját alkotásai';

  UPDATE "_pages_v_blocks_repertoire_groups" g SET "_order" = 3
    FROM "_pages_v_blocks_repertoire" b JOIN "_pages_v" v ON v."id" = b."_parent_id"
    WHERE g."_parent_id" = b."id" AND v."latest" AND g."group" = 'students';
  INSERT INTO "_pages_v_blocks_repertoire_groups" ("_order", "_parent_id", "group", "eyebrow", "heading", "intro", "_uuid")
    SELECT 2, b."id", 'classics', ${SECTION}, substr(md5(random()::text), 1, 24)
    FROM "_pages_v_blocks_repertoire" b JOIN "_pages_v" v ON v."id" = b."_parent_id"
    WHERE v."latest";
  UPDATE "_pages_v_blocks_repertoire_groups" g SET "heading" = 'Nagyszínpadi produkciók'
    FROM "_pages_v_blocks_repertoire" b JOIN "_pages_v" v ON v."id" = b."_parent_id"
    WHERE g."_parent_id" = b."id" AND v."latest" AND g."group" = 'company' AND g."heading" = 'Társulati előadások';
  UPDATE "_pages_v_blocks_repertoire_groups" g
    SET "heading" = 'Hallgatóink saját előadásai', "intro" = 'Az alábbi előadásokat hallgatóink hozták létre és ők is viszik színre.'
    FROM "_pages_v_blocks_repertoire" b JOIN "_pages_v" v ON v."id" = b."_parent_id"
    WHERE g."_parent_id" = b."id" AND v."latest" AND g."group" = 'students' AND g."heading" = 'Hallgatóink saját alkotásai';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "pages_blocks_repertoire_groups" WHERE "group" = 'classics';
  DELETE FROM "_pages_v_blocks_repertoire_groups" WHERE "group" = 'classics';
  UPDATE "pages_blocks_repertoire_groups" SET "_order" = 2 WHERE "group" = 'students';
  UPDATE "_pages_v_blocks_repertoire_groups" SET "_order" = 2 WHERE "group" = 'students';
  UPDATE "productions" SET "group" = 'students' WHERE "group" = 'classics';
  UPDATE "_productions_v" SET "version_group" = 'students' WHERE "version_group" = 'classics';

  ${rebuild(['company', 'students'])}`)
}
