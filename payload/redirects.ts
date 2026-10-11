/**
 * Redirects (@payloadcms/plugin-redirects): old addresses → current pages. Mostly the URLs of the
 * previous WordPress site (/rolunk-2/, /kepzeseink-2/, /molnar-ferenc-az-ordog/…), so links and
 * search results keep working. The site looks a redirect up only when a path has no page
 * (app/(frontend)/[[...slug]] and /repertoar/[slug]), so it costs nothing on normal requests.
 */
import type { RedirectsPluginConfig } from '@payloadcms/plugin-redirects/types';
import type { Field } from 'payload';

import { contentAccess } from './access';
import { importId } from './fields';
import { collectionRevalidation } from './revalidate';

export const redirectsConfig: RedirectsPluginConfig = {
  collections: ['pages', 'productions'],
  redirectTypes: ['301', '302'],
  redirectTypeFieldOverride: {
    label: 'Típus',
    defaultValue: '301',
    options: [
      { label: 'Végleges (301) — a régi cím megszűnt', value: '301' },
      { label: 'Ideiglenes (302)', value: '302' },
    ],
    admin: { description: 'Régi címekhez szinte mindig a véglegeset válaszd: így a Google is átviszi a helyezést.' },
  },
  overrides: {
    labels: { singular: 'Átirányítás', plural: 'Átirányítások' },
    access: contentAccess,
    defaultSort: 'from',
    admin: {
      group: 'Oldalak',
      useAsTitle: 'from',
      defaultColumns: ['from', 'destination', 'type', 'updatedAt'],
      description:
        'Régi vagy megszűnt címek továbbítása egy mostani oldalra (pl. a korábbi weboldal /rolunk-2/ címe → Rólunk).',
    },
    hooks: collectionRevalidation('redirects'),
    fields: ({ defaultFields }) => [
      ...defaultFields.map((field) =>
        'name' in field && field.name === 'from'
          ? ({
              ...field,
              admin: {
                ...field.admin,
                description:
                  'A régi cím, a domain nélkül, perjellel kezdve: pl. /rolunk-2 (a végén lévő perjel nem számít).',
              },
            } as Field)
          : field,
      ),
      {
        // shown in the list ("Cél" column): where the redirect actually goes, e.g. /repertoar/az-ordog
        name: 'destination',
        label: 'Cél',
        type: 'text',
        virtual: true,
        admin: {
          readOnly: true,
          position: 'sidebar',
          description: 'Ide visz az átirányítás (a fenti beállításból számolva).',
        },
        hooks: {
          afterRead: [
            async ({ siblingData, req }) => {
              const to = siblingData.to as
                | { type?: string; url?: string; reference?: { relationTo: string; value: unknown } }
                | undefined;
              if (to?.type === 'custom') return to.url;
              const ref = to?.reference;
              if (!ref?.value) return undefined;
              const doc =
                typeof ref.value === 'object'
                  ? (ref.value as { path?: string; slug?: string })
                  : await req.payload
                      .findByID({
                        collection: ref.relationTo as 'pages' | 'productions',
                        id: ref.value as number,
                        depth: 0,
                        draft: true,
                        req,
                      })
                      .catch(() => null);
              if (!doc) return undefined;
              return ref.relationTo === 'productions'
                ? `/repertoar/${(doc as { slug?: string }).slug}`
                : (doc as { path?: string }).path;
            },
          ],
        },
      },
      importId,
    ],
  },
};

/** The plugin has no Hungarian translations; these replace its English labels. */
export const redirectsTranslationsHu = {
  'plugin-redirects': {
    fromUrl: 'Régi cím',
    toUrlType: 'Hová vigyen?',
    internalLink: 'Oldalra / előadásra',
    customUrl: 'Egyéni címre',
    documentToRedirect: 'Cél oldal vagy előadás',
    redirectType: 'Típus',
  },
};
