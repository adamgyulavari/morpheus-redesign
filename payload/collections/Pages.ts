import type { CollectionConfig } from 'payload';

import { draftContentAccess } from '../access';
import { blocks } from '../blocks';
import { importId, text } from '../fields';
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
    description: 'A weboldal oldalai. Minden oldal blokkokból áll, amelyek sorrendje szabadon módosítható.',
    livePreview: { url: ({ data }) => (data?.path ? previewPath(data.path) : null) },
    preview: (data) => (data?.path ? previewPath(data.path as string) : null),
  },
  defaultSort: 'path',
  versions: { drafts: { autosave: { interval: 500 } }, maxPerDoc: 30 },
  hooks: collectionRevalidation('pages'),
  // The tabs come first, so the SEO plugin (payload.config.ts) can add its "SEO" tab next to them.
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tartalom',
          fields: [
            {
              type: 'row',
              fields: [
                text('title', 'Rövid név', {
                  required: true,
                  description: 'Ahol más oldalak hivatkoznak rá (pl. az oldalváltóban).',
                }),
                {
                  name: 'path',
                  label: 'Útvonal',
                  type: 'text',
                  required: true,
                  unique: true,
                  index: true,
                  admin: { description: 'Az oldal címe a weboldalon: „/” a nyitóoldal, különben pl. /rolunk' },
                  validate: (value: unknown) =>
                    typeof value === 'string' && /^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/.test(value)
                      ? true
                      : 'Pl. / vagy /rolunk — kisbetű, szám, kötőjel',
                },
              ],
            },
            // opened from the live site's edit overlay with ?blokk=<id>: scrolls to that block
            {
              name: 'blockFocus',
              type: 'ui',
              admin: { components: { Field: '@/payload/components/BlockFocus#BlockFocus' } },
            },
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
    importId,
  ],
};
