import type { CollectionConfig } from 'payload';

import { draftContentAccess } from '../access';
import { blocks } from '../blocks';
import { importId, text, textarea } from '../fields';
import { previewPath } from '../preview';
import { collectionRevalidation } from '../revalidate';

/** Every content page: its route, title/description, frame and an ordered list of blocks. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Oldal', plural: 'Oldalak' },
  access: draftContentAccess,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', '_status', 'updatedAt'],
    group: 'Oldalak',
    description: 'A weboldal oldalai. Minden oldal blokkokból áll, amelyek sorrendje szabadon módosítható.',
    livePreview: { url: ({ data }) => (data?.path ? previewPath(data.path) : null) },
    preview: (data) => (data?.path ? previewPath(data.path as string) : null),
  },
  defaultSort: 'path',
  versions: { drafts: { autosave: { interval: 500 } }, maxPerDoc: 30 },
  hooks: collectionRevalidation('pages'),
  fields: [
    {
      type: 'row',
      fields: [
        text('title', 'Rövid név', { required: true, description: 'Ahol más oldalak hivatkoznak rá (pl. az oldalváltóban).' }),
        {
          name: 'path',
          label: 'Útvonal',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { description: 'Az oldal címe a weboldalon: „/” a nyitóoldal, különben pl. /rolunk' },
          validate: (value: unknown) => (typeof value === 'string' && /^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/.test(value) ? true : 'Pl. / vagy /rolunk — kisbetű, szám, kötőjel'),
        },
      ],
    },
    {
      name: 'layout',
      label: 'Keret',
      type: 'select',
      required: true,
      defaultValue: 'site',
      options: [
        { label: 'Teljes oldal (fejléc + lábléc)', value: 'site' },
        { label: 'Keskeny, önálló oszlop (bio)', value: 'minimal' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tartalom',
          fields: [
            {
              name: 'blocks',
              label: 'Blokkok',
              labels: { singular: 'Blokk', plural: 'Blokkok' },
              type: 'blocks',
              blocks,
              admin: { initCollapsed: true },
            },
          ],
        },
        {
          name: 'meta',
          label: 'Keresők (SEO)',
          fields: [
            text('title', 'Böngésző címsor', { required: true, description: 'Pl. „Rólunk — Morpheus Színműhely”' }),
            textarea('description', 'Leírás', { required: true, description: 'A Google-találatban megjelenő 1–2 mondat.' }),
          ],
        },
      ],
    },
    importId,
  ],
};
