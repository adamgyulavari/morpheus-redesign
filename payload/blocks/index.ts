/**
 * Page blocks: one Payload block per `Block` variant in lib/types.ts (same `blockType` slugs and
 * field names), so lib/data.ts can hand the documents to components/blocks/ almost as they are.
 */
import type { Block, Field } from 'payload';

import type { BlockType } from '@/lib/types';

import {
  blockBase,
  emphasised,
  eyebrow,
  facts,
  image,
  link,
  links,
  linksRichText,
  paragraphs,
  relationship,
  section,
  stringList,
  text,
  textarea,
} from '../fields';

type Def = { slug: BlockType; label: string; description?: string; fields?: Field[] };

const block = ({ slug, label, description, fields = [] }: Def): Block => ({
  slug,
  labels: { singular: label, plural: label },
  admin: { disableBlockName: true },
  fields: [
    ...(description ? [{ name: 'help', type: 'ui', admin: { components: { Field: '@/payload/components/BlockHelp#BlockHelp' }, custom: { text: description } } } as Field] : []),
    ...fields,
    blockBase,
  ],
});

const cards = <T extends Field[]>(name: string, label: string, singular: string, fields: T, required = true): Field => ({
  name,
  label,
  labels: { singular, plural: label },
  type: 'array',
  required,
  fields,
});

const titleText = (): Field[] => [text('title', 'Cím', { required: true }), textarea('text', 'Szöveg', { required: true })];

export const blocks: Block[] = [
  // ── heroes
  block({
    slug: 'homeHero',
    label: 'Nyitóoldali fejléc',
    description: 'A nyitóoldal teteje: kulcsszavak, cím, két gomb, a logó a fotókkal és a következő előadás kártyája.',
    fields: [
      stringList('keywords', 'Kulcsszavak', { required: true, singular: 'Kulcsszó' }),
      emphasised('heading', 'Cím', { required: true }),
      textarea('lead', 'Bevezető', { required: true }),
      { type: 'row', fields: [link('primaryCta', 'Fő gomb', { required: true }), link('secondaryCta', 'Másodlagos gomb', { required: true })] },
      { type: 'row', fields: [image('imageLarge', 'Nagy kör alakú fotó', { required: true }), image('imageSmall', 'Kis kör alakú fotó', { required: true })] },
      { name: 'nextShow', label: 'A következő előadás kártyája', type: 'checkbox', defaultValue: true },
    ],
  }),
  block({
    slug: 'pageHero',
    label: 'Oldal fejléc',
    description: 'Az aloldalak teteje: cím, bevezető, fotó, és ha kell: tények, gombok, oldalváltó.',
    fields: [
      text('heading', 'Cím', { required: true }),
      textarea('lead', 'Bevezető', { required: true }),
      image('image', 'Fotó', { required: true }),
      {
        name: 'layout',
        label: 'A fotó elrendezése',
        type: 'group',
        fields: [
          {
            type: 'row',
            fields: [
              { name: 'shape', label: 'Forma', type: 'select', options: [{ label: 'Fekvő', value: 'landscape' }, { label: 'Álló', value: 'portrait' }] },
              { name: 'size', label: 'Méret', type: 'select', options: [{ label: 'Kicsi', value: 'sm' }, { label: 'Közepes', value: 'md' }, { label: 'Nagy', value: 'lg' }] },
              { name: 'tilt', label: 'Döntés (fok)', type: 'number', admin: { description: 'Negatív: balra, pl. -2.5' } },
              {
                name: 'position',
                label: 'Helyzet',
                type: 'select',
                options: [
                  { label: 'Fent', value: 'top' },
                  { label: 'Középen', value: 'middle' },
                  { label: 'Lent', value: 'bottom' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'switcher',
        label: 'Oldalváltó a cím fölött',
        type: 'group',
        admin: { description: 'Testvéroldalak közötti kapcsoló (pl. Kezdő / Szakmai kurzus). Üresen hagyva nem jelenik meg.' },
        fields: [
          text('label', 'Felirat'),
          cards('pages', 'Oldalak', 'Oldal', [relationship('page', 'Oldal', 'pages', { required: true }), text('label', 'Felirat', { description: 'Üresen az oldal címe.' })], false),
        ],
      },
      facts(),
      cards(
        'buttons',
        'Gombok',
        'Gomb',
        [
          ...link('_', '', { required: true }).fields,
          {
            type: 'row',
            fields: [
              { name: 'variant', label: 'Stílus', type: 'select', options: [{ label: 'Kitöltött', value: 'primary' }, { label: 'Körvonalas', value: 'outline' }] },
              {
                name: 'showIf',
                label: 'Csak ha…',
                type: 'select',
                options: [{ label: 'van közelgő workshop', value: 'upcomingWorkshops' }],
              },
            ],
          },
        ],
        false,
      ),
      { name: 'repertoireFilter', label: 'Repertoár-szűrő gombok', type: 'checkbox', admin: { description: 'Mind / Társulati / Hallgatói — csak a Repertoár oldalon.' } },
    ],
  }),

  // ── editorial
  block({
    slug: 'ctaBand',
    label: 'Felhívás sáv',
    description: 'Egy előre elkészített felhívás sáv (az „Oldalak → Felhívás sávok” közül).',
    fields: [relationship('ctaBand', 'Felhívás sáv', 'ctaBands', { required: true })],
  }),
  block({
    slug: 'textSplit',
    label: 'Cím és szöveg',
    fields: [
      ...section(),
      { name: 'size', label: 'Cím mérete', type: 'select', options: [{ label: 'Közepes', value: 'md' }, { label: 'Nagy', value: 'xl' }] },
      textarea('text', 'Szöveg', { required: true }),
      facts(),
    ],
  }),
  block({ slug: 'statement', label: 'Kiemelt állítás (sötét sáv)', fields: [...section(), textarea('text', 'Szöveg', { required: true })] }),
  block({
    slug: 'imageText',
    label: 'Kép és szöveg',
    fields: [...section(), textarea('quote', 'Idézet'), paragraphs('paragraphs', 'Bekezdések', { required: true }), image('image', 'Kép', { required: true })],
  }),
  block({
    slug: 'linkCards',
    label: 'Link kártyák',
    fields: [...section(), cards('cards', 'Kártyák', 'Kártya', [eyebrow(), text('title', 'Cím', { required: true }), text('href', 'Link', { required: true }), textarea('text', 'Szöveg', { required: true })])],
  }),
  block({
    slug: 'questions',
    label: 'Kérdések (sötét sáv)',
    fields: [...section(), cards('items', 'Kérdések', 'Kérdés', titleText()), emphasised('closing', 'Záró mondat', { required: true }), link('cta', 'Gomb', { required: true })],
  }),
  block({
    slug: 'benefits',
    label: 'Előnyök (sötét sáv)',
    fields: [...section(), textarea('text', 'Szöveg'), stringList('items', 'Pontok', { singular: 'Pont' })],
  }),
  block({
    slug: 'curriculum',
    label: 'Tananyag',
    fields: [
      ...section(),
      stringList('items', 'Pontok', { required: true, singular: 'Pont' }),
      {
        name: 'bonus',
        label: 'Ráadás doboz',
        type: 'group',
        admin: { description: 'Üresen hagyva nem jelenik meg.' },
        fields: [eyebrow({ required: false }), text('heading', 'Cím'), textarea('text', 'Szöveg')],
      },
      image('image', 'Kép', { required: true }),
    ],
  }),
  block({
    slug: 'featureCards',
    label: 'Kiemelt kártyák',
    fields: [
      cards('cards', 'Kártyák', 'Kártya', [
        eyebrow(),
        text('heading', 'Cím'),
        textarea('quote', 'Idézet'),
        text('quoteSource', 'Az idézet forrása'),
        textarea('text', 'Szöveg', { required: true }),
      ]),
    ],
  }),
  block({
    slug: 'path',
    label: 'Út / lépések',
    description: 'Számozott lépések, vagy bekezdések (és egy fotó).',
    fields: [
      ...section(),
      cards('steps', 'Lépések', 'Lépés', [text('kicker', 'Felcím', { required: true }), ...titleText()], false),
      paragraphs('paragraphs', 'Bekezdések'),
      image('image', 'Kép'),
    ],
  }),
  block({
    slug: 'checklist',
    label: 'Ellenőrzőlista',
    fields: [...section(), stringList('items', 'Pontok', { required: true, singular: 'Pont' }), textarea('closing', 'Záró mondat', { required: true })],
  }),
  block({ slug: 'steps', label: 'Lépések', fields: [...section(), cards('steps', 'Lépések', 'Lépés', titleText())] }),
  block({
    slug: 'moodVideo',
    label: 'Hangulatvideó',
    fields: [
      ...section(),
      textarea('text', 'Szöveg', { required: true }),
      link('link', 'Link', { required: true }),
      {
        name: 'video',
        label: 'YouTube videó',
        type: 'group',
        fields: [
          {
            type: 'row',
            fields: [
              text('youtubeId', 'YouTube azonosító', { required: true, description: 'A videócím v= utáni része, pl. lOyTSWtWcwY' }),
              text('title', 'A videó címe', { required: true }),
            ],
          },
        ],
      },
    ],
  }),
  block({ slug: 'fullImage', label: 'Teljes szélességű kép', fields: [image('image', 'Kép', { required: true })] }),
  block({ slug: 'socialBand', label: 'Közösségi média sáv', fields: [text('heading', 'Cím', { required: true }), link('link', 'Link', { required: true })] }),

  // ── driven by collections
  block({
    slug: 'offerings',
    label: 'Kínálat kártyák',
    description: 'Kártyák a képzésekről. Kurzust választva a kártya a kurzus adataiból készül; különben töltsd ki a mezőket.',
    fields: [
      ...section(),
      link('instructorsLink', 'Oktatók link', { required: true }),
      cards('cards', 'Kártyák', 'Kártya', [
        relationship('course', 'Kurzus', 'courses'),
        {
          type: 'collapsible',
          label: 'Saját kártya (ha nincs kurzus kiválasztva)',
          admin: { condition: (_, sibling) => !sibling?.course },
          fields: [text('badge', 'Címke'), text('title', 'Cím'), textarea('text', 'Szöveg'), facts(), link('cta', 'Gomb')],
        },
      ]),
    ],
  }),
  block({ slug: 'reviews', label: 'Vélemények', description: 'Az összes vélemény csúszkában.', fields: [...section(), textarea('intro', 'Bevezető', { required: true })] }),
  block({
    slug: 'instructorRow',
    label: 'Oktatók (sor)',
    description: 'Az oktatók fotói egy sorban, szöveggel és linkkel.',
    fields: [...section(), textarea('text', 'Szöveg', { required: true }), link('link', 'Link', { required: true })],
  }),
  block({ slug: 'instructorGrid', label: 'Oktatók (rács)', description: 'Az összes oktató bemutatkozással.' }),
  block({
    slug: 'upcomingShows',
    label: 'Közelgő előadások',
    description: 'A mai naptól számított előadások, az „Időpontok” közül.',
    fields: [
      {
        name: 'variant',
        label: 'Forma',
        type: 'select',
        required: true,
        defaultValue: 'list',
        options: [
          { label: 'Egy lista címmel', value: 'list' },
          { label: 'Hónapok szerint', value: 'byMonth' },
        ],
      },
      { type: 'row', fields: [eyebrow({ required: false }), text('heading', 'Cím')] },
      link('headerLink', 'Link a cím mellett', { description: 'Üresen hagyva nem jelenik meg.' }),
      links('links', 'Linkek alul'),
    ],
  }),
  block({ slug: 'nextShowBanner', label: 'Következő előadás sáv', description: 'Csak akkor látszik, ha van közelgő előadás.', fields: [link('link', 'Link', { required: true })] }),
  block({
    slug: 'repertoire',
    label: 'Repertoár',
    description: 'A darabok csoportonként (társulati / hallgatói).',
    fields: [
      cards('groups', 'Csoportok', 'Csoport', [
        {
          name: 'group',
          label: 'Csoport',
          type: 'select',
          required: true,
          options: [
            { label: 'Társulati előadások', value: 'company' },
            { label: 'Hallgatói előadások', value: 'students' },
          ],
        },
        ...section(),
        textarea('intro', 'Bevezető', { required: true }),
      ]),
    ],
  }),
  block({ slug: 'contactCard', label: 'Kapcsolat kártya', description: 'Az elsődleges kapcsolattartó (Beállítások) kártyája.', fields: [...section(), link('cta', 'Gomb', { required: true })] }),
  block({
    slug: 'courseStarts',
    label: 'Induló csoportok',
    description: 'A kurzus jövőbeli induló csoportjai; ha nincs ilyen, a „folyamatos jelentkezés” szöveg vagy egy üres állapot.',
    fields: [
      relationship('course', 'Kurzus', 'courses', { required: true }),
      ...section(),
      textarea('intro', 'Bevezető'),
      {
        name: 'rolling',
        label: 'Folyamatos jelentkezés',
        type: 'group',
        admin: { description: 'Csak folyamatos jelentkezésű kurzusnál töltsd ki.' },
        fields: [
          { name: 'text', label: 'Szöveg', type: 'richText', editor: linksRichText },
          textarea('note', 'Megjegyzés'),
          link('inquiry', 'Érdeklődés gomb'),
        ],
      },
    ],
  }),
  block({ slug: 'coursePrices', label: 'Kurzus árak', fields: [relationship('course', 'Kurzus', 'courses', { required: true }), ...section(), textarea('intro', 'Bevezető')] }),
  block({ slug: 'courseCompare', label: 'Kurzusok összehasonlítása', fields: [...section(), relationship('courses', 'Kurzusok', 'courses', { required: true, hasMany: true })] }),
  block({ slug: 'upcomingWorkshops', label: 'Közelgő workshopok', description: 'A közelgő workshopok kiemelve; ha nincs ilyen, nem jelenik meg semmi.' }),
  block({
    slug: 'pastWorkshops',
    label: 'Korábbi workshopok',
    fields: [...section(), { name: 'limit', label: 'Legfeljebb ennyi', type: 'number', required: true, defaultValue: 3 }],
  }),
  block({
    slug: 'openWorkshopSessions',
    label: 'Nyitott Műhely időpontok',
    fields: [
      ...section(),
      textarea('intro', 'Bevezető', { required: true }),
      text('title', 'Az alkalom neve', { required: true }),
      { name: 'limit', label: 'Legfeljebb ennyi időpont', type: 'number', required: true, defaultValue: 4 },
    ],
  }),
  block({ slug: 'programmes', label: 'Csapatépítő programok', fields: section() }),
  block({
    slug: 'quoteRequest',
    label: 'Árajánlatkérés',
    description: 'Az árajánlatkérő űrlap. Az űrlap szövegei a „Felületi szövegek” között.',
    fields: [...section(), textarea('text', 'Szöveg', { required: true }), stringList('goals', 'Célok', { required: true, singular: 'Cél' }), image('image', 'Kép', { required: true })],
  }),
  block({
    slug: 'contactPeople',
    label: 'Kapcsolattartók',
    fields: [{ name: 'email', label: 'E-mail szakasz', type: 'group', fields: [eyebrow(), text('heading', 'Cím', { required: true })] }],
  }),
  block({
    slug: 'location',
    label: 'Helyszín és térkép',
    fields: [...section(), stringList('addressLines', 'Cím sorai', { required: true, singular: 'Sor' }), textarea('text', 'Szöveg', { required: true })],
  }),
  block({ slug: 'legalDocument', label: 'Jogi dokumentum', fields: [relationship('document', 'Dokumentum', 'legalPages', { required: true })] }),

  // ── link-in-bio
  block({ slug: 'bioIntro', label: 'Bio: bemutatkozás', description: 'Logó, név és jelmondat a Beállításokból.' }),
  block({ slug: 'bioNextShow', label: 'Bio: következő előadás' }),
  block({ slug: 'linkList', label: 'Bio: linkek', fields: [links('links', 'Linkek', { required: true })] }),
  block({ slug: 'socialLinks', label: 'Bio: közösségi média' }),
  block({ slug: 'contactFooter', label: 'Bio: kapcsolat lábléc' }),
];
