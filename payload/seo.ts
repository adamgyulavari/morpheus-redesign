/**
 * SEO (@payloadcms/plugin-seo): the SEO tab on pages and productions (`meta`), and the
 * "Automatikus generálás" buttons. The generators follow the same rules the site uses when a field
 * is left empty (lib/cms-map.ts, the production route), so generating and leaving empty agree:
 * - title: "<name> — <site name>"
 * - description: productions: the first sentence of the story; pages: the hero's lead
 * - image: productions: the hero image (landscape), else the poster; pages: the hero photo
 *   (left empty, a production page shares its full poster, as before)
 */
import type { GenerateDescription, GenerateImage, GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types';
import type { Field, PayloadRequest } from 'payload';

import { serverUrl } from '@/lib/env';
import { firstSentence } from '@/lib/format';
import { paragraphsFromRichText } from '@/lib/cms-map';

type Doc = {
  title?: string;
  path?: string;
  slug?: string;
  summary?: string;
  poster?: unknown;
  heroImage?: unknown;
  gallery?: unknown[];
  longDescription?: unknown;
  blocks?: { blockType: string; lead?: string; image?: unknown; imageLarge?: unknown }[];
};

const idOf = (v: unknown) => (v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : (v as number | undefined));

async function siteName(req: PayloadRequest) {
  const settings = await req.payload.findGlobal({ slug: 'siteSettings', depth: 0, req }).catch(() => null);
  return settings?.name ?? 'Morpheus Színműhely';
}

const hero = (doc: Doc) => doc.blocks?.find((b) => b.blockType === 'pageHero' || b.blockType === 'homeHero');

export const generateTitle: GenerateTitle<Doc> = async ({ doc, req }) => `${doc.title ?? ''} — ${await siteName(req)}`;

export const generateDescription: GenerateDescription<Doc> = ({ doc, collectionSlug }) => {
  if (collectionSlug === 'productions') {
    const [first] = paragraphsFromRichText(doc.longDescription as never);
    return firstSentence(first ?? doc.summary ?? '');
  }
  return hero(doc)?.lead ?? '';
};

export const generateImage: GenerateImage<Doc> = ({ doc, collectionSlug }) => {
  const h = hero(doc);
  const image = collectionSlug === 'productions' ? (doc.heroImage ?? doc.gallery?.[0] ?? doc.poster) : (h?.image ?? h?.imageLarge);
  return (idOf(image) ?? '') as number;
};

export const generateURL: GenerateURL<Doc> = ({ doc, collectionSlug }) => {
  const base = serverUrl();
  return collectionSlug === 'productions' ? `${base}/repertoar/${doc.slug ?? ''}` : `${base}${doc.path ?? '/'}`;
};

/** Hungarian labels and hints on the plugin's fields (overview, title, description, image, preview). */
export const seoFields = ({ defaultFields }: { defaultFields: Field[] }): Field[] =>
  defaultFields.map((field) => {
    if (!('name' in field)) return field;
    const hints: Record<string, { label: string; description: string }> = {
      title: { label: 'Böngésző címsor', description: 'A Google-találat címe és a böngészőfül felirata. Üresen: „<név> — Morpheus Színműhely”.' },
      description: { label: 'Leírás', description: 'A Google-találatban megjelenő 1–2 mondat.' },
      image: { label: 'Megosztási kép', description: 'Facebookon és más oldalakon megosztva ez a kép látszik (1200×630-ra vágva a fókuszpont körül).' },
    };
    const hint = hints[field.name];
    return hint ? ({ ...field, label: hint.label, admin: { ...field.admin, description: hint.description } } as Field) : field;
  });
