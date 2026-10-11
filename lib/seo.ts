import type { Metadata } from 'next';

import type { ImageRef } from './types';

/**
 * The <head> metadata of a page: title, description, canonical URL and Open Graph (sharing).
 * Next.js replaces (not merges) a parent's `openGraph`, so every route builds the full set here.
 * Relative URLs are made absolute with `metadataBase` (the root layout, NEXT_PUBLIC_SERVER_URL).
 */
export function pageMetadata({
  title,
  description,
  image,
  path,
  siteName,
  type = 'website',
}: {
  title: string;
  description?: string;
  image?: ImageRef;
  path: string;
  siteName: string;
  type?: 'website' | 'article';
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: 'hu_HU',
      siteName,
      url: path,
      title,
      description,
      images: image ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] : undefined,
    },
  };
}

/** Same as the previous (WordPress) site: allow large image previews in search results. */
export const robots: Metadata['robots'] = { index: true, follow: true, 'max-image-preview': 'large' };
