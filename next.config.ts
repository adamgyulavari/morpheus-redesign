import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

/**
 * A Node server (Docker, `output: 'standalone'`) running the site and Payload CMS together:
 * the admin at /admin, the API at /api, the pages render on demand and are cached (ISR).
 */
const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    // The page was renamed when workshops moved onto it; keep old links working.
    return [{ source: '/nyitott-muhely', destination: '/nyitott-alkalmak', permanent: true }];
  },
  images: {
    // Uploaded media, served by Payload (from local disk or S3)
    localPatterns: [{ pathname: '/api/media/file/**' }],
    // The homepage video facade shows YouTube's own thumbnail until the player is loaded.
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
