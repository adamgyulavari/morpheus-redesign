/** Productions (the repertoire), their shows, and the legal pages. */
import { type CollectionConfig, slugField } from 'payload';

import { slugify } from '@/lib/slugify';

import {
  contentAccess,
  draftContentAccess,
  isAdmin,
  isStaffOrAdmin,
  isStaffOrAdminField,
  publishedOrStaff,
} from '../access';
import { date, fullRichText, image, importId, paragraphsRichText, relationship, text, textarea, time } from '../fields';
import { previewPath } from '../preview';
import { collectionRevalidation } from '../revalidate';

const slug = () =>
  slugField({
    useAsSlug: 'title',
    slugify: ({ valueToSlugify }) => (typeof valueToSlugify === 'string' ? slugify(valueToSlugify) : undefined),
    position: 'sidebar',
    overrides: (row) => {
      for (const f of row.fields) {
        if ('name' in f && f.name === 'slug') {
          f.label = 'URL-azonosító';
          f.admin = {
            ...f.admin,
            description: 'A címből készül automatikusan; átírható. Pl. az-ordog → /repertoar/az-ordog',
          };
        }
      }
      return row;
    },
  });

export const Productions: CollectionConfig = {
  slug: 'productions',
  labels: { singular: 'Előadás (darab)', plural: 'Repertoár' },
  access: draftContentAccess,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'group', 'byline', '_status', 'updatedAt'],
    description: 'A darabok. Az időpontokat az „Előadás-időpontok” között adhatod meg.',
    livePreview: { url: ({ data }) => (data?.detailPage && data.slug ? previewPath(`/repertoar/${data.slug}`) : null) },
    preview: (data) => (data?.slug ? previewPath(`/repertoar/${data.slug as string}`) : null),
  },
  defaultSort: 'order',
  versions: { drafts: { autosave: { interval: 500 } }, maxPerDoc: 30 },
  hooks: collectionRevalidation('productions'),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Alapadatok',
          fields: [
            text('title', 'Cím', { required: true }),
            {
              type: 'row',
              fields: [
                {
                  name: 'group',
                  label: 'Csoport',
                  type: 'select',
                  required: true,
                  defaultValue: 'company',
                  options: [
                    { label: 'Társulati előadás', value: 'company' },
                    { label: 'Hallgatói előadás', value: 'students' },
                  ],
                },
                text('genre', 'Műfaj', { description: 'Pl. „Dráma”' }),
              ],
            },
            text('byline', 'Szerző / alcím', {
              required: true,
              description: 'A műfaj mellett és az időpontsorokban jelenik meg: a szerző, vagy pl. „Hallgatói előadás”.',
            }),
            textarea('summary', 'Rövid leírás', { required: true, description: 'A repertoár kártyáján.' }),
            image('poster', 'Plakát', { required: true }),
            textarea('note', 'Megjegyzés', { description: 'Rövid kiegészítés a kártya alján (nem kötelező).' }),
            {
              name: 'detailPage',
              label: 'Saját aloldala van',
              type: 'checkbox',
              admin: {
                description:
                  'Bekapcsolva a „Bővebben” a /repertoar/… oldalra visz; kikapcsolva felugró ablakban mutatja a leírást.',
              },
            },
          ],
        },
        {
          label: 'Leírás és aloldal',
          fields: [
            text('tagline', 'Mottó', { description: 'Egy soros felvezetés a cím alatt az aloldalon.' }),
            text('descriptionHeading', 'Leírás címe', {
              description: 'Az aloldalon a leírás fölötti cím, pl. a történet első mondata.',
            }),
            {
              name: 'longDescription',
              label: 'Hosszú leírás',
              type: 'richText',
              editor: paragraphsRichText,
              required: true,
              admin: {
                description: 'Bekezdésekre bontva. A „…” idézőjelek közé írt bekezdés kiemelt idézetként jelenik meg.',
              },
            },
            {
              name: 'highlights',
              label: 'Miért gyere el? (pontok)',
              labels: { singular: 'Pont', plural: 'Pontok' },
              type: 'array',
              fields: [text('title', 'Cím', { required: true }), textarea('text', 'Szöveg', { required: true })],
            },
            {
              name: 'audienceQuotes',
              label: 'Nézői vélemények',
              labels: { singular: 'Vélemény', plural: 'Vélemények' },
              type: 'array',
              fields: [textarea('text', 'Idézet', { required: true }), text('author', 'Név')],
            },
            text('videoUrl', 'YouTube videó', { description: 'A videó teljes YouTube-címe.' }),
            {
              name: 'gallery',
              label: 'Galéria',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: 'Képek az előadásból.' },
            },
            image('heroImage', 'Fejléckép', {
              description: 'Az aloldal tetején. Ha üres, a galéria első képe, végül a plakát.',
            }),
            image('heroVideo', 'Fejléc háttérvideó', {
              description: 'Néma, ismétlődő videó a fejlécben (a fejléckép az állókép).',
            }),
            {
              name: 'inviteVideo',
              label: 'Személyes meghívó videó',
              type: 'group',
              admin: { description: 'Négyzetes, hangos videó, pl. a rendező ajánlója.' },
              fields: [image('video', 'Videó'), text('title', 'Cím'), image('poster', 'Borítókép')],
            },
          ],
        },
        {
          label: 'Alkotók',
          fields: [
            {
              name: 'credits',
              label: 'Alkotók',
              labels: { singular: 'Alkotó', plural: 'Alkotók' },
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    text('label', 'Szerep', { required: true, description: 'Pl. „Rendező”' }),
                    text('name', 'Név', { required: true }),
                  ],
                },
              ],
            },
            text('castLabel', 'A szereposztás címe', {
              required: true,
              description: 'Pl. „Szereposztás” vagy „Szereplők”',
            }),
            {
              name: 'cast',
              label: 'Szereposztás',
              labels: { singular: 'Szerep', plural: 'Szerepek' },
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [text('role', 'Szerep'), text('roleNote', 'Megjegyzés a szerephez')],
                },
                {
                  name: 'names',
                  label: 'Név / nevek',
                  type: 'text',
                  hasMany: true,
                  required: true,
                  admin: { description: 'Kettős szereposztásnál mindkét nevet add meg (Enter a nevek között).' },
                },
              ],
            },
          ],
        },
        {
          // not shown on the public site; for the room calendar and the student area
          label: 'Próbák',
          description:
            'A próbák és vizsgák a Teremnaptárban kezelhetők; a megadott csoportok hallgatói látják őket a fiókjukban.',
          fields: [
            {
              ...relationship('courseGroups', 'Játszó csoportok', 'courseGroups', {
                hasMany: true,
                description: 'Ezek a csoportok játsszák: a hallgatóik látják a próbákat, és gyakorolhatnak hozzá.',
              }),
              access: { read: isStaffOrAdminField },
            },
            {
              name: 'sessions',
              label: 'Alkalmak',
              type: 'join',
              collection: 'sessions',
              on: 'production',
              defaultSort: 'start',
              access: { read: isStaffOrAdminField },
              admin: { defaultColumns: ['displayTitle', 'kind', 'start', 'locationType', 'status'] },
            },
          ],
        },
      ],
    },
    {
      name: 'order',
      label: 'Sorrend',
      type: 'number',
      admin: { position: 'sidebar', description: 'A repertoárban kisebb szám kerül előrébb.' },
    },
    slug(),
    importId,
  ],
};

export const Shows: CollectionConfig = {
  slug: 'shows',
  labels: { singular: 'Előadás-időpont', plural: 'Előadás-időpontok' },
  access: contentAccess,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['date', 'time', 'production', 'venue', 'label'],
    description:
      'Az előadások időpontjai. Elöl a legkésőbbi; a múltbeli időpontok másnap automatikusan eltűnnek az oldalról. A Facebook-eseményekből a „Szinkronizálás a Facebookról” gombbal jönnek.',
    components: { beforeListTable: ['@/payload/components/FacebookSync#FacebookSync'] },
  },
  defaultSort: '-date',
  hooks: collectionRevalidation('shows'),
  fields: [
    {
      // the Facebook event it comes from (lib/facebook/sync): its date, time, venue, ticket follow it
      name: 'facebookEventId',
      label: 'Facebook-esemény',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true, description: 'A szinkron tölti ki.' },
    },
    {
      name: 'hidden',
      label: 'Elrejtve',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Nem jelenik meg az oldalon. A szinkron kapcsolja be, ha az esemény a Facebookon elmarad vagy törölték.',
      },
    },
    relationship('production', 'Előadás', 'productions', { required: true }),
    { type: 'row', fields: [date('date', 'Dátum', { required: true }), time('time', 'Kezdés', { required: true })] },
    relationship('venue', 'Helyszín', 'venues', { required: true }),
    text('label', 'Címke', { description: 'Nem kötelező, pl. „Nyilvános főpróba”.' }),
    {
      type: 'row',
      fields: [
        text('ticketUrl', 'Jegyvásárlás (link)', { description: 'Pl. a Tixa-oldal.' }),
        text('registrationUrl', 'Regisztráció (link)', {
          description: 'Ingyenes, regisztrációs előadásnál a jegy helyett.',
        }),
      ],
    },
    {
      name: 'info',
      label: 'Tudnivalók',
      labels: { singular: 'Sor', plural: 'Sorok' },
      type: 'array',
      admin: { description: 'Gyakorlati információk a nézőknek, soronként.' },
      fields: [{ name: 'text', label: 'Szöveg', type: 'textarea', required: true, admin: { rows: 2 } }],
    },
    {
      // "Az ördög — 2026. 10. 03. 18:00", for the admin list and relationship pickers
      name: 'title',
      label: 'Előadás és időpont',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          async ({ siblingData, req }) => {
            const id = siblingData.production;
            const production = id
              ? await req.payload
                  .findByID({ collection: 'productions', id, depth: 0, draft: true, req, select: { title: true } })
                  .catch(() => null)
              : null;
            const day =
              typeof siblingData.date === 'string' ? `${siblingData.date.slice(0, 10).replaceAll('-', '. ')}.` : '';
            return [production?.title, `${day} ${siblingData.time ?? ''}`.trim()].filter(Boolean).join(' — ');
          },
        ],
      },
    },
    importId,
  ],
};

export const LegalPages: CollectionConfig = {
  slug: 'legalPages',
  labels: { singular: 'Jogi dokumentum', plural: 'Jogi dokumentumok' },
  access: { read: publishedOrStaff, create: isStaffOrAdmin, update: isStaffOrAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'effectiveDate', '_status'],
    description:
      'Pl. az adatkezelési tájékoztató. Egy oldalon a „Jogi dokumentum” blokkal jelenik meg. Törölni csak adminisztrátor tud.',
  },
  defaultSort: 'title',
  versions: { drafts: true, maxPerDoc: 30 },
  hooks: collectionRevalidation('legalPages'),
  fields: [
    text('title', 'Cím', { required: true }),
    date('effectiveDate', 'Hatályos', { description: 'A hatályba lépés napja.' }),
    {
      name: 'body',
      label: 'Szöveg',
      type: 'richText',
      editor: fullRichText,
      required: true,
      admin: { description: 'A „Címsor 2” fejezetek bekerülnek a tartalomjegyzékbe.' },
    },
    slug(),
    importId,
  ],
};
