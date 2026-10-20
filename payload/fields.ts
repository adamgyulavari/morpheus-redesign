import { randomUUID } from 'node:crypto';

/**
 * Reusable field builders, so every collection and block describes the same kinds of content the
 * same way (labels and hints in Hungarian, for the editors).
 */
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  lexicalEditor,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical';
import type { ArrayField, DateField, Field, GroupField, RelationshipField, TextField, UploadField } from 'payload';

/** Old id from the JSON import; lets `npm run seed` update records instead of duplicating them. */
export const importId: TextField = {
  name: 'importId',
  type: 'text',
  unique: true,
  index: true,
  admin: { hidden: true },
};

type Opts = { required?: boolean; description?: string };

export const text = (name: string, label: string, opts: Opts = {}): TextField => ({
  name,
  label,
  type: 'text',
  required: opts.required,
  admin: opts.description ? { description: opts.description } : undefined,
});

export const textarea = (name: string, label: string, opts: Opts = {}): Field => ({
  name,
  label,
  type: 'textarea',
  required: opts.required,
  admin: opts.description ? { description: opts.description } : undefined,
});

/** A heading where `*…*` marks the highlighted (italic, coloured) part. */
export const emphasised = (name: string, label: string, opts: Opts = {}): TextField =>
  text(name, label, {
    ...opts,
    description: opts.description ?? 'A *csillagok közé* írt rész kiemelve (dőlten, színesen) jelenik meg.',
  });

export const eyebrow = (opts: Opts = {}) =>
  text('eyebrow', 'Felcím', { required: opts.required ?? true, description: 'Kis, nagybetűs sor a cím fölött.' });

/** Eyebrow + heading, the top of most sections. */
export const section = (): Field[] => [
  { type: 'row', fields: [eyebrow(), emphasised('heading', 'Cím', { required: true })] },
];

/** A link: visible label + address (a page path like "/kapcsolat", "#horgony", or a full URL). */
export const link = (name: string, label: string, opts: Opts = {}): GroupField => ({
  name,
  label,
  type: 'group',
  admin: opts.description ? { description: opts.description } : undefined,
  fields: [
    {
      type: 'row',
      fields: [
        text('label', 'Felirat', { required: opts.required }),
        text('href', 'Cím (link)', {
          required: opts.required,
          description: 'Oldal (pl. /kapcsolat), szakasz (#idopontok) vagy teljes webcím (https://…).',
        }),
      ],
    },
  ],
});

export const links = (name: string, label: string, opts: Opts = {}): ArrayField => ({
  name,
  label,
  labels: { singular: 'Link', plural: 'Linkek' },
  type: 'array',
  required: opts.required,
  admin: opts.description ? { description: opts.description } : undefined,
  fields: link('_', '').fields,
});

/** Paragraphs of plain text; an Enter inside a paragraph is kept as a line break. */
export const paragraphs = (name: string, label: string, opts: Opts = {}): ArrayField => ({
  name,
  label,
  labels: { singular: 'Bekezdés', plural: 'Bekezdések' },
  type: 'array',
  required: opts.required,
  admin: { description: opts.description, initCollapsed: false },
  fields: [{ name: 'text', label: 'Szöveg', type: 'textarea', required: true }],
});

/** A list of short texts (bullet points, keywords, address lines…). */
export const stringList = (name: string, label: string, opts: Opts & { singular?: string } = {}): ArrayField => ({
  name,
  label,
  labels: { singular: opts.singular ?? 'Elem', plural: label },
  type: 'array',
  required: opts.required,
  admin: { description: opts.description },
  fields: [{ name: 'text', label: 'Szöveg', type: 'textarea', required: true, admin: { rows: 2 } }],
});

export const image = (name: string, label: string, opts: Opts = {}): UploadField => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  required: opts.required,
  admin: opts.description ? { description: opts.description } : undefined,
});

/** A calendar day (Budapest). */
export const date = (name: string, label: string, opts: Opts = {}): DateField => ({
  name,
  label,
  type: 'date',
  required: opts.required,
  index: true,
  admin: {
    description: opts.description,
    date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy. MM. dd.' },
  },
});

/** A moment (stored in UTC; the admin shows and picks it in the browser's zone, i.e. Budapest). */
export const dateTime = (name: string, label: string, opts: Opts = {}): DateField => ({
  name,
  label,
  type: 'date',
  required: opts.required,
  index: true,
  admin: {
    description: opts.description,
    date: {
      pickerAppearance: 'dayAndTime',
      displayFormat: 'yyyy. MM. dd. HH:mm',
      timeFormat: 'HH:mm',
      timeIntervals: 30,
    },
  },
});

/** A time of day as "HH:mm", e.g. 18:00. */
export const time = (name: string, label: string, opts: Opts = {}): TextField => ({
  name,
  label,
  type: 'text',
  required: opts.required,
  admin: { description: opts.description ?? 'Óra:perc, pl. 18:00', placeholder: '18:00', width: '50%' },
  validate: (value: unknown) =>
    value == null || value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value))
      ? true
      : 'Óra:perc formában add meg, pl. 18:00',
});

export const relationship = (
  name: string,
  label: string,
  relationTo: RelationshipField['relationTo'],
  opts: Opts & { hasMany?: boolean } = {},
) =>
  ({
    name,
    label,
    type: 'relationship',
    relationTo,
    hasMany: opts.hasMany ?? false,
    required: opts.required,
    admin: opts.description ? { description: opts.description } : undefined,
  }) as RelationshipField;

/** Label/value pairs (e.g. "Ritmus: heti 1×2 óra"). */
export const facts = (name = 'facts', label = 'Tények'): ArrayField => ({
  name,
  label,
  labels: { singular: 'Tény', plural: 'Tények' },
  type: 'array',
  admin: { description: 'Rövid címke–érték párok, pl. „Ritmus: heti 1 × 2 óra”.' },
  fields: [
    {
      type: 'row',
      fields: [
        text('label', 'Címke', { required: true }),
        text('value', 'Érték', { description: 'Üresen hagyható, ha az árat egy kurzusból vesszük.' }),
      ],
    },
    {
      type: 'row',
      fields: [
        text('href', 'Link (nem kötelező)'),
        relationship('coursePrice', 'Ár ebből a kurzusból', 'courses', {
          description: 'Ha kiválasztod, az érték a kurzus legalacsonyabb ára lesz („140 000 Ft-tól”).',
        }),
      ],
    },
  ],
});

const SPACES = [
  { label: 'nincs', value: 'none' },
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 'sm' },
  { label: 'M', value: 'md' },
  { label: 'L', value: 'lg' },
];

/** Fields every block has: section anchor and spacing. */
export const blockBase: Field = {
  type: 'collapsible',
  label: 'Horgony és térköz',
  admin: { initCollapsed: true },
  fields: [
    text('anchor', 'Horgony', {
      description: 'A szakasz azonosítója linkekhez, pl. „idopontok” → /oldal#idopontok. Ékezet és szóköz nélkül.',
    }),
    {
      name: 'spacing',
      label: 'Térköz',
      type: 'group',
      admin: { description: 'Üresen hagyva az alapértelmezett térköz érvényes.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'top', label: 'Fölötte', type: 'select', options: SPACES },
            { name: 'bottom', label: 'Alatta', type: 'select', options: SPACES },
          ],
        },
      ],
    },
  ],
};

/** Long texts with formatting: the legal pages. */
export const fullRichText = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    EXPERIMENTAL_TableFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
});

/** Plain paragraphs only — for texts whose look is fixed by the design (e.g. a production's story). */
export const paragraphsRichText = lexicalEditor({ features: () => [ParagraphFeature()] });

/** Paragraphs with links — for short texts that contain an inline link. */
export const linksRichText = lexicalEditor({
  features: () => [ParagraphFeature(), LinkFeature(), InlineToolbarFeature()],
});

/**
 * A random, unguessable id for the document's public links (e.g. /fiokom/jegyek/…):
 * never the sequential id in a URL. Filled when empty.
 */
export const publicId = (): Field => ({
  name: 'uid',
  type: 'text',
  unique: true,
  index: true,
  admin: { hidden: true },
  hooks: { beforeChange: [({ value }) => value || randomUUID()] },
});
