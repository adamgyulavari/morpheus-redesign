import type { MetadataRoute } from 'next';

import { serverUrl } from '@/lib/env';

/** /robots.txt (must live at the app root, not in a route group): everything public is crawlable except the admin, the API and the preview routes. */
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const base = serverUrl();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
