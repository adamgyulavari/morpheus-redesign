import type { CollectionConfig, Where } from 'payload';

import { todayInBudapest } from '@/lib/dates';
import { WEEKDAYS } from '@/lib/rooms/labels';
import { isStaffOrAdmin, isStaffOrAdminField, userIsStaffOrAdmin } from '../access';

import { date, fullRichText, relationship, text, time } from '../fields';

/**
 * A concrete course group: dates, enrolled students, instructors (e.g. "Kezdő kurzus, 2026 ősz").
 * Not to be confused with `courses`, the course catalogue the public pages show (descriptions,
 * prices, next starts); a group may point to its catalogue entry.
 *
 * Students see only their own groups (in /fiokom and through the API), without the student list.
 * `monthlyFee` and `invoiceDay` are for the monthly billing of a later phase.
 */
export const CourseGroups: CollectionConfig = {
  slug: 'courseGroups',
  labels: { singular: 'Csoport', plural: 'Csoportok' },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (userIsStaffOrAdmin(user)) return true;
      return { students: { in: [user.id] } } satisfies Where;
    },
    create: isStaffOrAdmin,
    update: isStaffOrAdmin,
    delete: isStaffOrAdmin,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'startDate', 'endDate', 'studentCount', 'isActive'],
    group: 'Kurzusok',
    description:
      'Az induló és futó csoportok a hallgatóikkal. A hallgatók a fiókjukban (/fiokom) látják a saját csoportjaikat.',
  },
  defaultSort: '-startDate',
  fields: [
    text('title', 'Név', { required: true, description: 'Pl. „Kezdő kurzus — 2026 ősz, csütörtök”' }),
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          label: 'Típus',
          type: 'select',
          required: true,
          options: [
            { label: 'Kezdő', value: 'kezdo' },
            { label: 'Szakmai', value: 'szakmai' },
            { label: 'Egyéb', value: 'egyeb' },
          ],
        },
        relationship('course', 'Kurzus (a weboldalon)', 'courses', {
          description: 'Nem kötelező: melyik kurzus csoportja.',
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        date('startDate', 'Kezdés', { required: true }),
        {
          ...date('endDate', 'Befejezés', {
            required: true,
            description: 'Eddig a napig számít aktív hallgatónak, aki a csoportban van.',
          }),
          validate: (value: unknown, { siblingData }: { siblingData: { startDate?: string | null } }) => {
            if (!value) return 'Add meg a befejezés napját.';
            const start = siblingData.startDate;
            return !start || String(value).slice(0, 10) >= String(start).slice(0, 10)
              ? true
              : 'A befejezés nem lehet a kezdés előtt.';
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'monthlyFee',
          label: 'Havidíj (Ft)',
          type: 'number',
          min: 0,
          admin: { description: 'A havi számlázáshoz (később).' },
        },
        {
          name: 'invoiceDay',
          label: 'Számlázás napja',
          type: 'number',
          min: 1,
          max: 28,
          defaultValue: 5,
          admin: { description: 'A hónap hányadik napján (1–28).' },
        },
      ],
    },
    {
      name: 'info',
      label: 'Tudnivalók a hallgatóknak',
      type: 'richText',
      editor: fullRichText,
      admin: { description: 'Általános információk a csoportról; a hallgatók a fiókjukban látják.' },
    },
    {
      name: 'defaultSchedule',
      label: 'Órarend',
      labels: { singular: 'Időpont', plural: 'Időpontok' },
      type: 'array',
      admin: {
        description:
          'A heti órák. A Teremnaptár „Hónap feltöltése” gombja ezekből hozza létre az alkalmakat a kezdés és a befejezés között.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'weekday',
              label: 'Nap',
              type: 'select',
              required: true,
              options: WEEKDAYS.map((label, i) => ({ label, value: String(i + 1) })),
              admin: { width: '34%' },
            },
            { ...time('startTime', 'Kezdés', { required: true }), admin: { width: '33%', placeholder: '18:00' } },
            { ...time('endTime', 'Vége', { required: true }), admin: { width: '33%', placeholder: '21:00' } },
          ],
        },
        relationship('rooms', 'Termek', 'rooms', { hasMany: true, required: true }),
      ],
    },
    {
      name: 'fillMonth',
      type: 'ui',
      admin: { components: { Field: '@/payload/components/FillMonthLink#FillMonthLink' } },
    },
    {
      name: 'sessions',
      label: 'Alkalmak',
      type: 'join',
      collection: 'sessions',
      on: 'courseGroup',
      defaultSort: 'start',
      access: { read: isStaffOrAdminField },
      admin: { defaultColumns: ['displayTitle', 'kind', 'start', 'locationType', 'status'] },
    },
    {
      ...relationship('instructors', 'Oktatók', 'users', { hasMany: true }),
      filterOptions: { roles: { in: ['staff', 'admin'] } },
      access: { read: isStaffOrAdminField },
    },
    {
      ...relationship('students', 'Hallgatók', 'users', { hasMany: true }),
      access: { read: isStaffOrAdminField },
    },
    {
      name: 'studentCount',
      label: 'Létszám',
      type: 'number',
      virtual: true,
      admin: { readOnly: true, position: 'sidebar', description: 'A csoport hallgatóinak száma.' },
      access: { read: isStaffOrAdminField },
      hooks: {
        afterRead: [({ siblingData }) => (Array.isArray(siblingData.students) ? siblingData.students.length : 0)],
      },
    },
    {
      name: 'isActive',
      label: 'Aktív',
      type: 'checkbox',
      virtual: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Automatikus: a befejezés napjáig aktív.' },
      hooks: { afterRead: [({ siblingData }) => isOngoing(siblingData.endDate as string | null | undefined)] },
    },
  ],
};

/** True until the end of the group's last day (Budapest). */
export function isOngoing(endDate: string | null | undefined): boolean {
  return Boolean(endDate) && String(endDate).slice(0, 10) >= todayInBudapest();
}
