/**
 * The UI texts (Beállítások → Felületi szövegek): one document per language, its texts as one JSON
 * value, edited in the admin as a form built from the catalogue (payload/ui-catalogue.ts). The
 * server keeps every language in memory and reloads them when one is saved.
 */
import { revalidatePath } from 'next/cache';
import type { CollectionConfig, Payload } from 'payload';

import { anyone, isStaffOrAdmin } from './access';
import { storedTexts, textAt, UI_TEXTS, type UiStrings, uiStrings } from './ui-catalogue';

/** The language every other one falls back to; its texts are all required. */
export const BASE_LANG = 'hu';

export const UiTexts: CollectionConfig = {
  slug: 'uiTexts',
  labels: { singular: 'Felületi szövegek', plural: 'Felületi szövegek' },
  access: { read: anyone, create: isStaffOrAdmin, update: isStaffOrAdmin, delete: isStaffOrAdmin },
  admin: {
    useAsTitle: 'lang',
    defaultColumns: ['lang', 'updatedAt'],
    description:
      'A weboldal szövegei, amelyek nem oldaltartalmak: gombok, üres állapotok, felolvasott feliratok, űrlapok. A {kapcsos} részeket a weboldal tölti ki — ezeket hagyd meg.',
  },
  fields: [
    {
      name: 'lang',
      label: 'Nyelv',
      type: 'select',
      required: true,
      unique: true,
      options: [{ label: 'Magyar', value: BASE_LANG }],
    },
    {
      name: 'texts',
      label: 'Szövegek',
      type: 'json',
      required: true,
      admin: { components: { Field: '@/payload/admin/UiTextsField#UiTextsField' } },
      hooks: { beforeChange: [({ value }) => storedTexts(value)] },
      validate: (value: unknown, { siblingData }: { siblingData: { lang?: string } }) => {
        if (siblingData.lang !== BASE_LANG) return true;
        const missing = UI_TEXTS.filter((t) => !textAt(value, t.path)?.trim());
        return missing.length ? `Hiányzik: ${missing.map((t) => t.label).join(', ')}` : true;
      },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, req }) => {
        forget(req.payload);
        return doc;
      },
    ],
    afterDelete: [({ req }) => forget(req.payload)],
  },
};

// ── reading them ────────────────────────────────────────────────────────────

/** `catalogue`: the keys it was built for — new ones (a deploy, or a dev server's reload) mean a reload. */
type Store = { loading?: Promise<Map<string, UiStrings>>; catalogue?: string };
// on globalThis: the admin's and the site's bundles share it (one server process)
const shared = globalThis as { __uiTexts?: Store };
shared.__uiTexts ??= {};
const store = shared.__uiTexts;

/** Every language's texts, complete (missing ones from the base language). Loaded once. */
function languages(payload: Payload): Promise<Map<string, UiStrings>> {
  const catalogue = UI_TEXTS.map((t) => t.path.join('.')).join();
  if (store.catalogue !== catalogue) {
    store.loading = undefined;
    store.catalogue = catalogue;
  }
  store.loading ??= payload
    .find({ collection: 'uiTexts', depth: 0, limit: 0, pagination: false })
    .then(({ docs }) => {
      const base = docs.find((d) => d.lang === BASE_LANG)?.texts;
      return new Map(docs.map((d) => [d.lang, uiStrings(d.texts, base)]));
    })
    .catch((err) => {
      store.loading = undefined;
      throw err;
    });
  return store.loading;
}

/** One language's texts (the base language's when it has none). */
export async function uiTexts(payload: Payload, lang = BASE_LANG): Promise<UiStrings> {
  const all = await languages(payload);
  return all.get(lang) ?? all.get(BASE_LANG) ?? uiStrings({});
}

/** After a save: reload on the next read, and re-render the cached pages. */
function forget(payload: Payload) {
  store.loading = undefined;
  try {
    revalidatePath('/', 'layout');
  } catch (err) {
    // outside a Next.js request (the seed script) there is nothing to revalidate
    payload.logger.debug({ err }, 'skipped revalidating /');
  }
}
