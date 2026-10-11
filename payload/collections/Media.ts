import type { CollectionConfig } from 'payload';

import { contentAccess } from '../access';
import { importId } from '../fields';
import { collectionRevalidation } from '../revalidate';

/**
 * Images and videos. In production the files live in S3 (Leafcloud Object Storage, see
 * payload.config.ts); locally in ./media. Payload serves them at /api/media/file/<name>.
 *
 * Sizes are generated on upload. They keep the original proportions (the design crops with CSS),
 * except the Open Graph and admin thumbnails, which are cropped around the focal point.
 */
const webp = { format: 'webp' as const, options: { quality: 82 } };

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Kép / videó', plural: 'Képek és videók' },
  access: contentAccess,
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    group: 'Tartalom',
    description: 'Feltöltött képek és videók. A fókuszpont jelöli, mi maradjon látható, ha a képet körbe kell vágni.',
  },
  defaultSort: '-updatedAt',
  hooks: collectionRevalidation('media'),
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm'],
    focalPoint: true,
    crop: true,
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 300, height: 300, position: 'centre' },
      // 3:4-ish posters keep their own proportions (A-format and 2:3 posters both appear)
      { name: 'poster', width: 900, withoutEnlargement: true, formatOptions: webp },
      // portraits and small cards
      { name: 'card', width: 720, withoutEnlargement: true, formatOptions: webp },
      { name: 'gallery', width: 1600, withoutEnlargement: true, formatOptions: webp },
      // full-width bands and hero backgrounds
      { name: 'band', width: 2400, withoutEnlargement: true, formatOptions: webp },
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: webp },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alternatív szöveg',
      type: 'text',
      required: true,
      admin: { description: 'Mi látható a képen? Ezt olvassa fel a képernyőolvasó, és ez jelenik meg, ha a kép nem tölt be.' },
    },
    importId,
  ],
};
