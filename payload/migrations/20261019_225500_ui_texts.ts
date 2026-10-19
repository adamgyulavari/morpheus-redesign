import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// The UI texts move from the `ui` global (a column per text) to the `uiTexts` collection: one
// document per language, its texts as one JSON value (payload/ui-texts.ts) — a new text no longer
// needs a new column, and other languages can follow. The Hungarian document gets the texts the
// global has; on a database where the global was never saved, these (its wording at this point).
type Texts = { [key: string]: string | Texts };
const HU: Texts = {
  "common": {
    "close": "Bezárás",
    "readMore": "Tovább olvasom",
    "more": "Bővebben",
    "signup": "Jelentkezem",
    "mainNav": "Főmenü",
    "openMenu": "Menü megnyitása",
    "closeMenu": "Menü bezárása",
    "sliderPage": "{n}. oldal",
    "slideshow": "diavetítés",
    "playVideo": "{title} lejátszása",
    "facebook": "A Morpheus Színműhely Facebook-oldala",
    "instagram": "A Morpheus Színműhely Instagram-oldala",
    "toc": "Tartalom",
    "tocLabel": "Tartalomjegyzék",
    "links": "Linkek"
  },
  "shows": {
    "ticket": "Jegyek",
    "registration": "Regisztráció",
    "about": "Az előadásról",
    "info": "Tudnivalók",
    "nextShow": "Következő előadás",
    "onStage": "Műsoron",
    "upcomingCount": "{count} előadás a következő hetekben",
    "empty": "Hamarosan új előadásokkal jelentkezünk."
  },
  "production": {
    "backLink": "Vissza a repertoárhoz",
    "upcomingLink": "Közelgő előadások",
    "about": "Az előadásról",
    "highlights": "Még mindig bizonytalan vagy?",
    "quotes": "Így látják a darabot nézőink…",
    "video": "Érezd meg az előadás különleges hangulatát!",
    "gallery": "Képek az előadásból:",
    "galleryLabel": "{title} — képek",
    "dates": "Vedd meg a jegyed!",
    "noDates": "Jelenleg nincs meghirdetett előadás.",
    "ctaDates": "Megnézem az időpontokat",
    "ctaBook": "Ez érdekel, lefoglalom a helyem",
    "ctaConvinced": "Meggyőztetek, lássam az időpontokat!",
    "invite": "Hadd hívjunk meg személyesen!"
  },
  "repertoire": {
    "filter": "Szűrés",
    "all": "Mind",
    "company": "Társulati előadások",
    "students": "Hallgatói előadások"
  },
  "reviews": {
    "previous": "Előző vélemények",
    "next": "Következő vélemények",
    "photoPlaceholder": "Fotó helye: {name} portréja"
  },
  "gallery": {
    "previous": "Előző képek",
    "next": "Következő képek",
    "previousImage": "Előző kép",
    "nextImage": "Következő kép",
    "zoom": "{alt} — nagyítás"
  },
  "course": {
    "rhythm": "Ritmus",
    "length": "Hossz",
    "admission": "Felvétel",
    "price": "Díj",
    "start": "Indulás",
    "startRolling": "folyamatos jelentkezés",
    "startSoon": "hamarosan",
    "details": "Részletek",
    "nextIntake": "Következő induló szakmai kurzus",
    "startsEmpty": "Hamarosan új csoportokat indítunk. Kérdésed van? Írj vagy hívj bátran!",
    "startsEmptyLink": {
      "label": "Kapcsolat",
      "href": "/kapcsolat"
    }
  },
  "workshops": {
    "date": "Időpont",
    "time": "Minden nap",
    "leader": "Kurzusvezető",
    "leaderHeading": "A kurzusvezetőről",
    "empty": "Hamarosan új workshoppal jelentkezünk.",
    "followUs": "Kövess minket a Facebookon"
  },
  "sessions": {
    "book": "Jelentkezem",
    "closed": "Lezárult",
    "needed": "Még {count} jelentkező kell az induláshoz",
    "confirmed": "Biztosan indul",
    "full": "Megtelt",
    "left": "{count} szabad hely",
    "empty": "Hamarosan új időpontokkal jelentkezünk."
  },
  "teamBuilding": {
    "duration": "Időkeret:",
    "venue": "Helyszín:"
  },
  "quoteForm": {
    "title": "Csapatépítő árajánlatkérés",
    "required": "A *-gal jelölt mezők kitöltése kötelező.",
    "fields": {
      "company": "Cég neve *",
      "lastName": "Vezetéknév *",
      "firstName": "Keresztnév *",
      "email": "E-mail cím *",
      "phone": "Telefonszám *",
      "message": "Kérdés, megjegyzés"
    },
    "messagePlaceholder": "Pl. létszám, időpont, helyszín, milyen program érdekel",
    "error": "Kérjük, töltsd ki a kötelező mezőket.",
    "submit": "Ajánlatot kérek",
    "note": "A küldés gombra kattintva a levelezőprogramod nyílik meg a kitöltött adatokkal — a levelet onnan tudod elküldeni nekünk.",
    "subject": "Csapatépítő árajánlatkérés – {company}",
    "mail": {
      "company": "Cég neve",
      "contact": "Kapcsolattartó",
      "email": "E-mail",
      "phone": "Telefon"
    }
  },
  "contact": {
    "person": "Kapcsolattartó",
    "directions": "Útvonaltervezés"
  },
  "notFound": {
    "title": "Az oldal nem található — Morpheus Színműhely",
    "eyebrow": "404 · Az oldal nem található",
    "heading": "Ez a jelenet *nincs a darabban.*",
    "text": "Az oldal, amit keresel, nem létezik, vagy közben máshová költözött. Kezdd újra a nyitóoldalon, vagy nézd meg, mikor játszunk legközelebb.",
    "primary": {
      "label": "Vissza a nyitóoldalra",
      "href": "/"
    },
    "secondary": {
      "label": "Közelgő előadások",
      "href": "/kozelgo-eloadasok"
    }
  }
};

// the paths of the texts, and their columns in `ui` (snake_case)
const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const paths = (t: Texts, at: string[] = []): string[][] =>
  Object.entries(t).flatMap(([k, v]) => (typeof v === 'string' ? [[...at, k]] : paths(v, [...at, k])));
const column = (path: string[]) => path.map(snake).join('_');
const get = (t: unknown, path: string[]) =>
  path.reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Texts)[k] : undefined), t);
const set = (t: Texts, path: string[], value: unknown) => {
  let o = t;
  for (const k of path.slice(0, -1)) o = (o[k] ??= {}) as Texts;
  o[path.at(-1) as string] = String(value);
};

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_ui_texts_lang" AS ENUM('hu');
  CREATE TABLE "ui_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lang" "enum_ui_texts_lang" NOT NULL,
  	"texts" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE UNIQUE INDEX "ui_texts_lang_idx" ON "ui_texts" USING btree ("lang");
  CREATE INDEX "ui_texts_updated_at_idx" ON "ui_texts" USING btree ("updated_at");
  CREATE INDEX "ui_texts_created_at_idx" ON "ui_texts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ui_texts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ui_texts_fk" FOREIGN KEY ("ui_texts_id") REFERENCES "public"."ui_texts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ui_texts_id_idx" ON "payload_locked_documents_rels" USING btree ("ui_texts_id");`);

  const { rows } = await db.execute(sql`SELECT * FROM "ui" LIMIT 1`);
  const row = rows[0] as Record<string, unknown> | undefined;
  const texts: Texts = {};
  for (const path of paths(HU)) set(texts, path, row?.[column(path)] ?? get(HU, path));
  await db.execute(sql`INSERT INTO "ui_texts" ("lang", "texts") VALUES ('hu', ${JSON.stringify(texts)}::jsonb)`);

  await db.execute(sql`DROP TABLE "ui" CASCADE;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const { rows } = await db.execute(sql`SELECT "texts" FROM "ui_texts" WHERE "lang" = 'hu'`);
  const texts = (rows[0] as { texts?: Texts } | undefined)?.texts ?? HU;
  const all = paths(HU);
  await db.execute(
    sql.raw(`CREATE TABLE "ui" (
  	"id" serial PRIMARY KEY NOT NULL,
  ${all.map((p) => `"${column(p)}" varchar NOT NULL,`).join('\n  ')}
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );`),
  );
  const values = all.map((p) => sql`${String(get(texts, p) ?? get(HU, p))}`);
  await db.execute(
    sql`INSERT INTO "ui" (${sql.raw(all.map((p) => `"${column(p)}"`).join(', '))}) VALUES (${sql.join(values, sql`, `)})`,
  );
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ui_texts_fk";
  DROP INDEX "payload_locked_documents_rels_ui_texts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ui_texts_id";
  DROP TABLE "ui_texts" CASCADE;
  DROP TYPE "public"."enum_ui_texts_lang";`);
}
