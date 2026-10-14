import type { CollectionConfig } from 'payload';

import { isStaffOrAdmin } from '../access';
import { image, relationship, text, textarea } from '../fields';

/** Staff manage these in the admin; students see them only through the room-calendar server functions. */
export const staffOnly = {
  read: isStaffOrAdmin,
  create: isStaffOrAdmin,
  update: isStaffOrAdmin,
  delete: isStaffOrAdmin,
};

/** The rooms of the studio (Nagyterem, Próbaterem, Iroda — seeded by a migration). */
export const Rooms: CollectionConfig = {
  slug: 'rooms',
  labels: { singular: 'Terem', plural: 'Termek' },
  access: staffOnly,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'capacity', 'active', 'studentBookable', 'order'],
    description:
      'A termek. Inaktív teremre nem lehet foglalni; diákok csak a „Diákok foglalhatják” termeket foglalhatják.',
  },
  defaultSort: 'order',
  fields: [
    {
      type: 'row',
      fields: [
        text('name', 'Név', { required: true }),
        { ...text('slug', 'Azonosító', { required: true }), unique: true },
      ],
    },
    textarea('description', 'Leírás'),
    {
      type: 'row',
      fields: [
        { name: 'capacity', label: 'Befogadóképesség (fő)', type: 'number', min: 0 },
        {
          name: 'color',
          label: 'Szín a naptárban',
          type: 'text',
          required: true,
          defaultValue: '#0f5f63',
          admin: { description: 'Hex színkód, pl. #0f5f63' },
          validate: (v: unknown) => (/^#[0-9a-fA-F]{6}$/.test(String(v ?? '')) ? true : 'Hex színkód, pl. #0f5f63'),
        },
      ],
    },
    image('photo', 'Fotó'),
    {
      type: 'row',
      fields: [
        { name: 'active', label: 'Aktív', type: 'checkbox', defaultValue: true },
        { name: 'studentBookable', label: 'Diákok foglalhatják', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'order',
      label: 'Sorrend',
      type: 'number',
      admin: { position: 'sidebar', description: 'Kisebb szám előrébb.' },
    },
  ],
};

/** Links for students in /fiokom (weekly timetable, shared folders…), for everyone or some groups. */
export const StudentLinks: CollectionConfig = {
  slug: 'studentLinks',
  labels: { singular: 'Hallgatói link', plural: 'Hallgatói linkek' },
  access: staffOnly,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'audience', 'active', 'order'],
    description: 'A hallgatók a fiókjukban látják: mindenki, vagy csak a kiválasztott csoportok hallgatói.',
  },
  defaultSort: 'order',
  fields: [
    text('title', 'Cím', { required: true }),
    {
      name: 'url',
      label: 'Link',
      type: 'text',
      required: true,
      admin: { description: 'Teljes webcím (https://…) vagy oldal (/…).' },
    },
    textarea('description', 'Leírás'),
    {
      name: 'audience',
      label: 'Kinek',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'Minden aktív hallgatónak', value: 'all' },
        { label: 'Kiválasztott csoportoknak', value: 'courseGroups' },
      ],
    },
    {
      ...relationship('courseGroups', 'Csoportok', 'courseGroups', { hasMany: true }),
      admin: { condition: (_, sibling) => sibling?.audience === 'courseGroups' },
    },
    {
      type: 'row',
      fields: [
        { name: 'active', label: 'Aktív', type: 'checkbox', defaultValue: true },
        { name: 'order', label: 'Sorrend', type: 'number' },
      ],
    },
  ],
};
