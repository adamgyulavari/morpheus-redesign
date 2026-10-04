import type { NextConfig } from 'next';

/**
 * Two build modes:
 * - default (`npm run build`): a normal Next.js server app — ISR (daily revalidate) and redirects work.
 * - GitHub Pages (`GITHUB_PAGES=true`): a fully static export into `out/`, served from
 *   https://<user>.github.io/<repo>/. Static hosting has no server, so: no redirects, no ISR (the workflow rebuilds daily instead), and images are served as-is
 *   through lib/image-loader.ts, which adds the base path.
 */
const pages = process.env.GITHUB_PAGES === 'true';
const basePath = pages ? (process.env.PAGES_BASE_PATH ?? '') : '';

const nextConfig: NextConfig = pages
  ? {
      output: 'export',
      basePath,
      trailingSlash: true, // /rolunk/index.html — works on any static host
      env: { NEXT_PUBLIC_BASE_PATH: basePath },
      images: { loader: 'custom', loaderFile: './lib/image-loader.ts' },
    }
  : {
      async redirects() {
        // The page was renamed when workshops moved onto it; keep old links working.
        return [{ source: '/nyitott-muhely', destination: '/nyitott-alkalmak', permanent: true }];
      },
      images: {
        // The homepage video facade shows YouTube's own thumbnail until the player is loaded.
        remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
      },
    };

export default nextConfig;
