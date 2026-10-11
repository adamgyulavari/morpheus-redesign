import type { MetadataRoute } from 'next';

import { getPages, getProductionsWithDetailPage } from '@/lib/data';
import { serverUrl } from '@/lib/env';

/** /sitemap.xml: every published page and production page. Built per request (no database at build time). */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = serverUrl();
  const [pages, productions] = await Promise.all([getPages(), getProductionsWithDetailPage()]);
  return [
    ...pages.map((p) => ({ url: `${base}${p.path}`, priority: p.path === '/' ? 1 : 0.7 })),
    ...productions.map((p) => ({ url: `${base}/repertoar/${p.slug}`, priority: 0.6 })),
  ];
}
