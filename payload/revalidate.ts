/**
 * On-demand revalidation. Pages are cached (ISR); when an editor saves, the pages that show the
 * changed content are regenerated. Which pages that are is derived from the data: each collection
 * is shown by certain block types (declared on the blocks, payload/blocks), and the pages containing
 * those blocks are revalidated (plus the production detail pages where relevant). Site-wide content
 * (settings, UI texts, media) revalidates everything.
 */
import { revalidatePath } from 'next/cache';
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
  Payload,
  PayloadRequest,
} from 'payload';

import type { BlockType } from '@/lib/types';

import { blocksShowing } from './blocks';

/** Block types that render each collection: declared on the blocks (payload/blocks). */
const SHOWN_BY = blocksShowing;

/** Blocks whose content depends on today's date (upcoming shows, course starts, sessions…). */
const DATE_DEPENDENT: BlockType[] = [
  ...(SHOWN_BY.shows ?? []),
  'offerings',
  'courseStarts',
  'courseCompare',
  'openWorkshopSessions',
  'upcomingWorkshops',
  'pastWorkshops',
  'pageHero',
];

/** Also re-render every production page (they list shows and the closing CTA band). */
const AFFECTS_PRODUCTION_PAGES = new Set(['shows', 'productions', 'venues', 'ctaBands']);

function revalidate(payload: Payload, path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
    payload.logger.info(`revalidated ${path}${type ? ` (${type})` : ''}`);
  } catch (err) {
    // Outside a Next.js request (e.g. the seed script) there is nothing to revalidate.
    payload.logger.debug({ err }, `skipped revalidating ${path}`);
  }
}

/** Paths of the pages that contain any of the given block types. */
async function pagesWith(payload: Payload, types: BlockType[]): Promise<string[]> {
  const wanted = new Set<string>(types);
  const { docs } = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 0,
    pagination: false,
    select: { path: true, blocks: true },
  });
  return docs.filter((p) => (p.blocks ?? []).some((b) => wanted.has(b.blockType))).map((p) => p.path);
}

export async function revalidatePagesWith(payload: Payload, types: BlockType[], productionPages = false) {
  for (const path of await pagesWith(payload, types)) revalidate(payload, path);
  if (productionPages) revalidate(payload, '/repertoar/[slug]', 'page');
}

/** Everything date-dependent — run hourly by the `revalidateDates` job. */
export const revalidateDateDependent = (payload: Payload) => revalidatePagesWith(payload, DATE_DEPENDENT, true);

const skip = (req: PayloadRequest) => Boolean(req.context.disableRevalidate);

type Doc = {
  _status?: string | null;
  slug?: string | null;
  path?: string | null;
  title?: string | null;
  production?: unknown;
};

/** Drafts and autosaves don't change the public site; publishing or unpublishing does. */
const isPublicChange = (doc: Doc, previousDoc?: Doc) =>
  doc._status === undefined || doc._status === 'published' || previousDoc?._status === 'published';

async function afterCollectionChange(slug: string, req: PayloadRequest, doc: Doc, previousDoc?: Doc) {
  const { payload } = req;
  if (slug === 'media') return revalidate(payload, '/', 'layout');
  if (slug === 'redirects') {
    // the old address may be cached as a 404 or as the previous redirect
    const froms = [(doc as { from?: string }).from, (previousDoc as { from?: string } | undefined)?.from];
    for (const from of new Set(froms.filter(Boolean) as string[])) revalidate(payload, from.replace(/\/+$/, '') || '/');
    return;
  }
  if (slug === 'pages') {
    for (const path of new Set([doc.path, previousDoc?.path].filter(Boolean) as string[])) revalidate(payload, path);
    // other pages show page titles in the course switcher
    if (previousDoc && previousDoc.title !== doc.title) await revalidatePagesWith(payload, ['pageHero']);
    return;
  }
  if (slug === 'productions') {
    for (const s of new Set([doc.slug, previousDoc?.slug].filter(Boolean))) revalidate(payload, `/repertoar/${s}`);
  }
  const types = SHOWN_BY[slug];
  if (types) await revalidatePagesWith(payload, types, AFFECTS_PRODUCTION_PAGES.has(slug) && slug !== 'productions');
}

/** afterChange/afterDelete hooks for a collection. */
export function collectionRevalidation(slug: string): NonNullable<CollectionConfig['hooks']> {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (!skip(req) && isPublicChange(doc, previousDoc)) await afterCollectionChange(slug, req, doc, previousDoc);
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (!skip(req)) await afterCollectionChange(slug, req, doc);
    return doc;
  };
  return { afterChange: [afterChange], afterDelete: [afterDelete] };
}

/** Globals are shown on every page (header, footer, UI texts). */
export function globalRevalidation(): NonNullable<GlobalConfig['hooks']> {
  const afterChange: GlobalAfterChangeHook = ({ doc, previousDoc, req }) => {
    if (!skip(req) && isPublicChange(doc, previousDoc)) revalidate(req.payload, '/', 'layout');
    return doc;
  };
  return { afterChange: [afterChange] };
}
