/**
 * The smaller collections: people, venues, programmes, courses and dated events.
 * Fields follow lib/types.ts; lib/data.ts maps the documents back to those types.
 */
import type { CollectionConfig } from 'payload';

import { contentAccess } from '../access';
import { date, emphasised, eyebrow, image, importId, link, paragraphs, text, textarea, time } from '../fields';
import { collectionRevalidation } from '../revalidate';

const PEOPLE = 'Emberek';
const PROGRAMMES = 'Képzések és programok';
const SHOWS = 'Előadások';
const PAGES = 'Oldalak';

export const Venues: CollectionConfig = {
  slug: 'venues',
  labels: { singular: 'Helyszín', plural: 'Helyszínek' },
  access: contentAccess,
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'shortName'], group: SHOWS, description: 'Ahol az előadásokat tartjuk.' },
  defaultSort: 'name',
  hooks: collectionRevalidation('venues'),
  fields: [
    text('name', 'Teljes név / cím', { required: true, description: 'Pl. „1027 Budapest, Frankel Leó út 6.”' }),
    text('shortName', 'Rövid név', { required: true, description: 'Listákban ez jelenik meg, pl. „Frankel Leó út 6.”' }),
    importId,
  ],
};

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Vélemény', plural: 'Vélemények' },
  access: contentAccess,
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'label', 'order'], group: PEOPLE, description: 'Hallgatói vélemények a csúszkában.' },
  defaultSort: 'order',
  hooks: collectionRevalidation('reviews'),
  fields: [
    { type: 'row', fields: [text('name', 'Név', { required: true }), text('label', 'Címke', { required: true, description: 'Pl. „Morpheus-hallgató”' })] },
    textarea('quote', 'Kiemelt idézet', { required: true, description: 'A kártyán megjelenő rövid idézet, „idézőjelekkel”.' }),
    paragraphs('fullText', 'Teljes vélemény', { required: true, description: 'A „Tovább olvasom” ablakban jelenik meg.' }),
    image('photo', 'Portré', { description: 'Nem kötelező; nélküle helykitöltő jelenik meg.' }),
    { name: 'order', label: 'Sorrend', type: 'number', admin: { position: 'sidebar', description: 'Kisebb szám előrébb kerül.' } },
    importId,
  ],
};

export const Instructors: CollectionConfig = {
  slug: 'instructors',
  labels: { singular: 'Oktató', plural: 'Oktatók' },
  access: contentAccess,
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'order'], group: PEOPLE, description: 'Az oktatók az Oktatóink oldalon és a nyitóoldalon.' },
  defaultSort: 'order',
  hooks: collectionRevalidation('instructors'),
  fields: [
    { type: 'row', fields: [text('name', 'Név', { required: true }), text('role', 'Szerep', { required: true, description: 'Pl. „Színészmesterség oktató”' })] },
    paragraphs('bio', 'Bemutatkozás', { required: true }),
    image('photo', 'Fotó', { required: true }),
    { name: 'order', label: 'Sorrend', type: 'number', required: true, admin: { position: 'sidebar', description: 'Kisebb szám előrébb kerül.' } },
    importId,
  ],
};

export const ContactPeople: CollectionConfig = {
  slug: 'contactPeople',
  labels: { singular: 'Kapcsolattartó', plural: 'Kapcsolattartók' },
  access: contentAccess,
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'phone'], group: PEOPLE, description: 'A Kapcsolat oldalon és a bio oldalon megjelenő személyek.' },
  defaultSort: 'order',
  hooks: collectionRevalidation('contactPeople'),
  fields: [
    { type: 'row', fields: [text('name', 'Név', { required: true }), text('role', 'Szerep', { required: true })] },
    text('phone', 'Telefonszám', { required: true, description: 'Nemzetközi formában, szóközök nélkül: +36304639129' }),
    image('photo', 'Fotó'),
    { name: 'order', label: 'Sorrend', type: 'number', admin: { position: 'sidebar' } },
    importId,
  ],
};

export const TeamBuildingProgrammes: CollectionConfig = {
  slug: 'teamBuildingProgrammes',
  labels: { singular: 'Csapatépítő program', plural: 'Csapatépítő programok' },
  access: contentAccess,
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'duration', 'order'], group: PROGRAMMES, description: 'A Csapatépítő oldalon felsorolt programok.' },
  defaultSort: 'order',
  hooks: collectionRevalidation('teamBuildingProgrammes'),
  fields: [
    text('name', 'Név', { required: true }),
    { type: 'row', fields: [text('duration', 'Időkeret', { required: true }), text('venue', 'Helyszín', { required: true })] },
    paragraphs('description', 'Leírás', { required: true }),
    { name: 'order', label: 'Sorrend', type: 'number', admin: { position: 'sidebar' } },
    importId,
  ],
};

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'Kurzus', plural: 'Kurzusok' },
  access: contentAccess,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rhythm', 'length'],
    group: PROGRAMMES,
    description: 'A kurzusok adatai, induló csoportjai és árai. Az oldalak ezekből építik a kártyákat, időpontokat és árakat.',
  },
  defaultSort: 'title',
  hooks: collectionRevalidation('courses'),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Alapadatok',
          fields: [
            { type: 'row', fields: [text('title', 'Név', { required: true }), text('slug', 'Azonosító', { required: true, description: 'Ékezet nélkül, pl. kezdo-kurzus' })] },
            {
              type: 'row',
              fields: [
                text('url', 'Kurzus oldala', { required: true, description: 'Pl. /kezdo-kurzus' }),
                text('signupUrl', 'Jelentkezési link', { required: true }),
              ],
            },
            {
              type: 'row',
              fields: [
                text('rhythm', 'Ritmus', { required: true, description: 'Pl. „heti 1×2 óra”' }),
                text('length', 'Hossz', { required: true, description: 'Pl. „20 alkalom (+2)”' }),
              ],
            },
            text('admission', 'Felvétel', { required: true, description: 'Pl. „előzetes tapasztalat nélkül” — a Képzések összehasonlításban.' }),
            {
              name: 'card',
              label: 'Kártya (nyitóoldal, Képzések)',
              type: 'group',
              fields: [
                text('badge', 'Címke', { required: true, description: 'Pl. „Kezdőknek”' }),
                textarea('text', 'Szöveg', { required: true }),
                text('ctaLabel', 'Gomb felirata', { required: true }),
              ],
            },
          ],
        },
        {
          label: 'Induló csoportok',
          description: 'A múltbeli időpontok automatikusan eltűnnek az oldalról.',
          fields: [
            {
              name: 'starts',
              label: 'Induló csoportok',
              labels: { singular: 'Csoport', plural: 'Csoportok' },
              type: 'array',
              fields: [
                date('date', 'Első alkalom', { required: true }),
                { type: 'row', fields: [time('startTime', 'Kezdés', { required: true }), time('endTime', 'Vége', { required: true })] },
              ],
            },
            {
              name: 'nextIntake',
              label: 'Következő indulás hónapja (folyamatos jelentkezésnél)',
              type: 'date',
              admin: {
                description: 'Ha nincs konkrét csoport, csak a hónapot jelezzük, pl. 2026. szeptember.',
                date: { pickerAppearance: 'monthOnly', displayFormat: 'yyyy. MMMM' },
              },
            },
          ],
        },
        {
          label: 'Árak',
          fields: [
            {
              name: 'prices',
              label: 'Árak',
              labels: { singular: 'Ár', plural: 'Árak' },
              type: 'array',
              required: true,
              fields: [
                { type: 'row', fields: [text('label', 'Megnevezés', { required: true }), { name: 'amount', label: 'Összeg (Ft)', type: 'number', required: true }] },
                {
                  type: 'row',
                  fields: [
                    text('per', 'Időszak', { description: 'Ismétlődő díjnál, pl. „hó” → „45 000 Ft / hó”.' }),
                    text('note', 'Megjegyzés', { description: 'Pl. „2 × 80 000 Ft”' }),
                  ],
                },
                { name: 'highlighted', label: 'Kiemelt', type: 'checkbox' },
              ],
            },
          ],
        },
      ],
    },
    importId,
  ],
};

export const OpenWorkshopSessions: CollectionConfig = {
  slug: 'openWorkshopSessions',
  labels: { singular: 'Nyitott Műhely alkalom', plural: 'Nyitott Műhely alkalmak' },
  access: contentAccess,
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'startTime', 'price', 'bookingDeadline'],
    group: PROGRAMMES,
    description: 'Szombati alkalmak. A múltbeli alkalmak automatikusan eltűnnek az oldalról.',
  },
  defaultSort: '-date',
  hooks: collectionRevalidation('openWorkshopSessions'),
  fields: [
    date('date', 'Dátum', { required: true }),
    { type: 'row', fields: [time('startTime', 'Kezdés', { required: true }), time('endTime', 'Vége', { required: true })] },
    { name: 'price', label: 'Ár (Ft)', type: 'number', required: true },
    text('bookingUrl', 'Foglalási link', { required: true }),
    date('bookingDeadline', 'Foglalási határidő', { required: true, description: 'A foglalás e nap végén zárul.' }),
    importId,
  ],
};

export const Workshops: CollectionConfig = {
  slug: 'workshops',
  labels: { singular: 'Workshop / tábor', plural: 'Workshopok és táborok' },
  access: contentAccess,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'startDate', 'endDate'],
    group: PROGRAMMES,
    description: 'A közelgő workshopok kiemelve jelennek meg; a lezajlottak a „Korábbi workshopok” közé kerülnek.',
  },
  defaultSort: '-startDate',
  hooks: collectionRevalidation('workshops'),
  fields: [
    { type: 'row', fields: [text('kind', 'Típus', { required: true, description: '„Workshop” vagy „Tábor” — felcímként jelenik meg.' }), text('title', 'Cím', { required: true })] },
    text('subtitle', 'Alcím', { description: 'Pl. „Szigethy Norberttel”' }),
    { type: 'row', fields: [date('startDate', 'Első nap', { required: true }), date('endDate', 'Utolsó nap', { required: true })] },
    { type: 'row', fields: [time('startTime', 'Napi kezdés', { required: true }), time('endTime', 'Napi befejezés', { required: true })] },
    textarea('intro', 'Bevezető mondat'),
    textarea('summary', 'Összefoglaló', { required: true }),
    {
      name: 'leader',
      label: 'Kurzusvezető',
      type: 'group',
      fields: [text('name', 'Név'), paragraphs('bio', 'Bemutatkozás')],
    },
    textarea('closing', 'Záró mondat'),
    text('signupUrl', 'Jelentkezési link', { required: true }),
    image('image', 'Fő kép', { required: true }),
    { name: 'gallery', label: 'Galéria', type: 'upload', relationTo: 'media', hasMany: true },
    importId,
  ],
};

export const CtaBands: CollectionConfig = {
  slug: 'ctaBands',
  labels: { singular: 'Felhívás sáv', plural: 'Felhívás sávok' },
  access: contentAccess,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'heading'],
    group: PAGES,
    description: 'Újrahasznosítható „Felhívás” sávok (felcím, cím, két gomb). Az oldalak hivatkoznak rájuk, így egy helyen szerkeszthetők.',
  },
  defaultSort: 'name',
  hooks: collectionRevalidation('ctaBands'),
  fields: [
    text('name', 'Belső név', { required: true, description: 'Csak az admin felületen látszik, a sáv kiválasztásához.' }),
    eyebrow(),
    emphasised('heading', 'Cím', { required: true }),
    textarea('text', 'Szöveg', { required: true }),
    { type: 'row', fields: [link('primary', 'Fő gomb', { required: true }), link('secondary', 'Másodlagos gomb', { required: true })] },
    importId,
  ],
};
