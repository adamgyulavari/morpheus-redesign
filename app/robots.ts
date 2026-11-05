import type { MetadataRoute } from 'next';

import { serverUrl } from '@/lib/env';
import { indexable } from '@/lib/seo';

/**
 * /robots.txt (must live at the app root, not in a route group): everything public is crawlable except
 * the admin, the API (but its images, /api/media: share images, posters) and the preview routes.
 * Staging (NOINDEX) lets crawlers in: they must read its pages' noindex to drop them from the results.
 */
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  if (!indexable()) return { rules: [{ userAgent: '*', allow: '/' }] };
  const base = serverUrl();
  return {
    rules: [{ userAgent: '*', allow: ['/', '/api/media/'], disallow: ['/admin', '/api', '/next'] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
