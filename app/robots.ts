import type { MetadataRoute } from 'next';

import { serverUrl } from '@/lib/env';
import { indexable } from '@/lib/seo';

/**
 * /robots.txt (must live at the app root, not in a route group): everything public is crawlable except
 * the admin, the API and the preview routes; nothing on staging (NOINDEX).
 */
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const base = serverUrl();
  if (!indexable()) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
