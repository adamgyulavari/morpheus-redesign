import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The page was renamed when workshops moved onto it; keep old links working.
  async redirects() {
    return [{ source: '/nyitott-muhely', destination: '/nyitott-alkalmak', permanent: true }];
  },
  images: {
    // The homepage video facade shows YouTube's own thumbnail until the player is loaded.
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
  },
};

export default nextConfig;
