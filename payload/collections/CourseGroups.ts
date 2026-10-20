import { randomBytes } from 'node:crypto';

import type { CollectionConfig, Where } from 'payload';

import { SIGNUP_KIND_OF_TYPE, SIGNUP_MODES } from '@/lib/applications/labels';
import { todayInBudapest } from '@/lib/dates';
import { options, WEEKDAYS } from '@/lib/rooms/labels';
import type { CourseGroup } from '@/payload-types';
import { isStaffOrAdmin, isStaffOrAdminField, userIsStaffOrAdmin } from '../access';

import { date, dateTime, fullRichText, relationship, text, time } from '../fields';
import { relId, relIds } from '../rel';
import { collectionRevalidation } from '../revalidate';

/**
 * A concrete course group: dates, enrolled students, instructors (e.g. "Kezdő kurzus, 2026 ősz").
 * Not to be confused with `courses`, the course catalogue the public pages show (descriptions,
 * prices, next starts); a group may point to its catalogue entry.
 *
 * Students see only their own groups (in /fiokom and through the API), without the student list.
 * `monthlyFee` and `invoiceDay` are for the monthly billing of a later phase.
 */
type Signup = NonNullable<CourseGroup['signup']>;

/** The window's dates only matter (and show) with "Időablakban". */
const inWindow = (_: unknown, sibling: Partial<Signup>) => sibling?.mode === 'window';
/** A kezdő sign-up (set, or from the group's type): payment options instead of one price. */
const isBeginner = (data: Partial<CourseGroup> | undefined, sibling?: Partial<Signup>) =>
  (sibling?.kind || SIGNUP_KIND_OF_TYPE[data?.type ?? ''] || 'beginner') === 'beginner';
const notBeginner = (data: Partial<CourseGroup>, sibling: Partial<Signup>) => !isBeginner(data, sibling);
const opensAt = dateTime('opensAt', 'Jelentkezés kezdete', { description: 'Üresen: azonnal.' });
const closesAt = dateTime('closesAt', 'Jelentkezés vége', { description: 'Üresen: a kurzus kezdéséig.' });

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
    description:
      'Az induló és futó csoportok a hallgatóikkal. A hallgatók a fiókjukban (/fiokom) látják a saját csoportjaikat.',
  },
  defaultSort: '-startDate',
  hooks: {
    // groups open for sign-up are on the course pages
    ...collectionRevalidation('courseGroups'),
    afterChange: [
      // whoever joins a group (admitted, paid, or added here) is a student from then on
      async ({ doc, previousDoc, req }) => {
        const before = new Set(relIds(previousDoc?.students));
        const joined = relIds(doc.students).filter((id) => !before.has(id));
        if (joined.length) {
          const { docs } = await req.payload.find({
            collection: 'users',
            where: { id: { in: joined } },
            depth: 0,
            limit: 0,
            pagination: false,
            req,
            overrideAccess: true,
          });
          for (const u of docs)
            if (!u.roles?.includes('student'))
              await req.payload.update({
                collection: 'users',
                id: u.id,
                data: { roles: [...(u.roles ?? []).filter((r) => r !== 'guest'), 'student'] },
                req,
                overrideAccess: true,
              });
        }
        return doc;
      },
      ...(collectionRevalidation('courseGroups').afterChange ?? []),
    ],
    beforeChange: [
      // the sign-up kind follows the group's type unless set (kezdő → beginner, szakmai → professional)
      async ({ data, originalDoc, operation, req }) => {
        const type = data.type ?? originalDoc?.type;
        if (data.signup && !data.signup.kind) data.signup.kind = SIGNUP_KIND_OF_TYPE[type] ?? 'beginner';
        // a new kezdő group starts with its course's prices as the payment options
        const courseId = relId(data.course ?? originalDoc?.course);
        if (operation === 'create' && data.signup?.kind === 'beginner' && !data.signup.options?.length && courseId) {
          const course = await req.payload.findByID({
            collection: 'courses',
            id: courseId,
            depth: 0,
            req,
            disableErrors: true,
          });
          data.signup.options = (course?.prices ?? []).map(({ label, amount, note, highlighted }) => ({
            label,
            amount,
            note,
            highlighted,
            installments: Number(/^\s*(\d+)\s*[×x]/.exec(note ?? '')?.[1] ?? 1),
          }));
        }
        // the group's public code: its checkout link (/fizetes/kurzus/…?csoport=…), not the id
        data.code = originalDoc?.code || data.code || randomBytes(6).toString('base64url');
        return data;
      },
    ],
  },
  fields: [
    text('title', 'Név', { required: true, description: 'Pl. „Kezdő kurzus — 2026 ősz, csütörtök”' }),
    { name: 'code', type: 'text', unique: true, index: true, admin: { hidden: true } },
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
            { label: 'Társulat', value: 'tarsulat' },
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
        {
          ...date('startDate', 'Kezdés', { description: 'A társulatnál nem kell.' }),
          validate: (value: unknown, { siblingData }: { siblingData: { type?: string | null } }) =>
            value || siblingData.type === 'tarsulat' ? true : 'Add meg a kezdés napját.',
        },
        {
          ...date('endDate', 'Befejezés', {
            description:
              'Eddig a napig számít aktív hallgatónak, aki a csoportban van. A társulatnál üresen: folyamatos.',
          }),
          validate: (
            value: unknown,
            { siblingData }: { siblingData: { startDate?: string | null; type?: string | null } },
          ) => {
            if (!value) return siblingData.type === 'tarsulat' ? true : 'Add meg a befejezés napját.';
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
          admin: { description: 'A havi számlázáshoz (később).', condition: (data) => data?.type !== 'kezdo' },
        },
        {
          name: 'invoiceDay',
          label: 'Számlázás napja',
          type: 'number',
          min: 1,
          max: 28,
          defaultValue: 5,
          admin: { description: 'A hónap hányadik napján (1–28).', condition: (data) => data?.type !== 'kezdo' },
        },
      ],
    },
    {
      name: 'signup',
      label: 'Jelentkezés a weboldalon',
      type: 'group',
      admin: {
        description:
          'A kurzus oldalán (a fenti „Kurzus” oldalán) ez a csoport jelenik meg induló csoportként, jelentkezési gombbal.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'mode',
              label: 'Jelentkezés',
              type: 'select',
              required: true,
              defaultValue: 'closed',
              options: options(SIGNUP_MODES),
              admin: { description: 'Időablakban: a lenti kezdet és vég között.' },
            },
            {
              name: 'kind',
              label: 'Jelentkezés módja',
              type: 'select',
              options: [
                { label: 'Kezdő: jelentkezés (helyfoglalás)', value: 'beginner' },
                { label: 'Szakmai: pályázat, interjú', value: 'professional' },
              ],
              admin: { description: 'Üresen a típusból: kezdő → kezdő, szakmai → szakmai.' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'price', label: 'Ár (Ft)', type: 'number', min: 0, admin: { condition: notBeginner } },
            {
              ...text('priceLabel', 'Ár felirata', { description: 'Pl. „45 000 Ft / hó” — ha üres, az ár.' }),
              admin: { description: 'Pl. „45 000 Ft / hó” — ha üres, az ár.', condition: notBeginner },
            },
            {
              name: 'capacity',
              label: 'Férőhely',
              type: 'number',
              min: 1,
              admin: { description: 'Csak kezdőnél számít. Üresen: nincs korlát.' },
            },
          ],
        },
        {
          name: 'payOnline',
          label: 'Online fizetés jelentkezéskor',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            condition: isBeginner,
            description:
              'A jelentkező a lenti lehetőségek közül választ és fizet (egy összegben vagy az első részletet); a fizetéssel felvesszük a csoportba. Kikapcsolva a jelentkezés ingyenes, a felvételről ti döntötök. (A Fizetési beállítások „Online fizetés” kapcsolója is kell hozzá.)',
          },
        },
        {
          name: 'options',
          label: 'Fizetési lehetőségek',
          labels: { singular: 'Lehetőség', plural: 'Lehetőségek' },
          type: 'array',
          admin: {
            condition: isBeginner,
            description:
              'A kurzus oldalán és a fizetésnél ezek látszanak. Új kezdő csoportnál a kurzus árai kerülnek ide; csoportonként módosíthatod.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                text('label', 'Megnevezés', { required: true, description: 'Pl. „Két részletben”' }),
                { name: 'amount', label: 'Teljes összeg (Ft)', type: 'number', min: 0, required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'installments',
                  label: 'Részletek száma',
                  type: 'number',
                  min: 1,
                  defaultValue: 1,
                  admin: { description: 'Jelentkezéskor az első részletet fizeti (összeg ÷ részletek).' },
                },
                text('note', 'Megjegyzés', { description: 'Pl. „kedvezményesen”' }),
                { name: 'highlighted', label: 'Alapértelmezett', type: 'checkbox' },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              ...opensAt,
              admin: { ...opensAt.admin, condition: inWindow },
              validate: (value: unknown, { siblingData }: { siblingData: Partial<Signup> }) =>
                siblingData.mode !== 'window' || value || siblingData.closesAt
                  ? true
                  : 'Időablakhoz add meg a kezdetet vagy a véget.',
            },
            {
              ...closesAt,
              admin: { ...closesAt.admin, condition: inWindow },
              validate: (value: unknown, { siblingData }: { siblingData: Partial<Signup> }) =>
                siblingData.mode !== 'window' ||
                !value ||
                !siblingData.opensAt ||
                new Date(String(value)) > new Date(siblingData.opensAt)
                  ? true
                  : 'A vége legyen a kezdet után.',
            },
          ],
        },
      ],
    },
    {
      name: 'applications',
      label: 'Jelentkezések',
      type: 'join',
      collection: 'applications',
      on: 'courseGroup',
      defaultSort: '-createdAt',
      access: { read: isStaffOrAdminField },
      admin: { defaultColumns: ['name', 'email', 'kind', 'status', 'paidOffline', 'createdAt'] },
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
      admin: { components: { Field: '@/payload/admin/FillMonthLink#FillMonthLink' } },
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

/** True until the end of the group's last day (Budapest); without an end (a társulat) always. */
export function isOngoing(endDate: string | null | undefined): boolean {
  return !endDate || String(endDate).slice(0, 10) >= todayInBudapest();
}
