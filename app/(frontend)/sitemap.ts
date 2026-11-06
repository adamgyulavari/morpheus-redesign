import type { MetadataRoute } from 'next';

import { getPages, getProductionsWithDetailPage } from '@/lib/data';
import { serverUrl } from '@/lib/env';

/** /sitemap.xml: every published page (not those hidden from search) and production page, with their last edit. Built per request (no database at build time). */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = serverUrl();
  const [pages, productions] = await Promise.all([getPages(), getProductionsWithDetailPage()]);
  return [
    ...pages
      .filter((page) => !page.noindex)
      .map((page) => ({
        url: `${base}${page.path}`,
        lastModified: page.updatedAt,
        priority: page.path === '/' ? 1 : 0.7,
      })),
    ...productions.map((production) => ({
      url: `${base}/repertoar/${production.slug}`,
      lastModified: production.updatedAt,
      priority: 0.6,
    })),
  ];
}
