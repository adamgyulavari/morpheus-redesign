import type { CollectionConfig, PayloadRequest, Where } from 'payload';
import { placesLeftFor } from '@/lib/applications/capacity';
import {
  APPLICATION_KINDS,
  type ApplicationKind,
  type ApplicationStatus,
  REVIEW_STATUSES,
  SIGNUP_STATUSES,
} from '@/lib/applications/labels';
import { ACTIVE_STATUSES, isActive, PLACE_STATUSES, takesPlace } from '@/lib/applications/rules';
import { whenText } from '@/lib/rooms/format';
import { options } from '@/lib/rooms/labels';

import { isStaffOrAdmin, userIsStaffOrAdmin } from '../access';
import { relationship, text, textarea } from '../fields';
import { type Rel, relId } from '../rel';
import { collectionRevalidation } from '../revalidate';
import { failer } from './placement';

type ApplicationDoc = {
  id?: number;
  kind?: ApplicationKind;
  status?: ApplicationStatus;
  user?: Rel;
  session?: Rel;
  courseGroup?: Rel;
  course?: Rel;
  holdUntil?: string | null;
  name?: string;
};

const fail = failer('applications');

const sameTargetOf = (a: ApplicationDoc, b: ApplicationDoc) =>
  relId(a.session) === relId(b.session) &&
  relId(a.courseGroup) === relId(b.courseGroup) &&
  relId(a.course) === relId(b.course);

const SIGNUP = Object.keys(SIGNUP_STATUSES) as ApplicationStatus[];
/** Statuses that end an application (`cancelledAt` is set). */
const CLOSED: ApplicationStatus[] = ['cancelled', 'withdrawn', 'moved'];
const REVIEW = Object.keys(REVIEW_STATUSES) as ApplicationStatus[];
export const statusesOf = (kind: ApplicationKind) => (kind === 'professional' ? REVIEW : SIGNUP);
export const initialStatus = (kind: ApplicationKind): ApplicationStatus =>
  kind === 'professional' ? 'new' : 'registered';

/** "Nyitott Műhely, okt. 18., szo 10:00–13:00" or the group's name. */
async function targetOf(req: PayloadRequest, a: ApplicationDoc): Promise<string> {
  const sessionId = relId(a.session);
  if (a.kind === 'workshop' && sessionId) {
    const s = await req.payload.findByID({ collection: 'sessions', id: sessionId, depth: 0, req, disableErrors: true });
    return s ? `${s.displayTitle}, ${whenText(s.start, s.end)}` : '';
  }
  const groupId = relId(a.courseGroup);
  if (!groupId) {
    const courseId = relId(a.course);
    const c = courseId
      ? await req.payload.findByID({ collection: 'courses', id: courseId, depth: 0, req, disableErrors: true })
      : null;
    return `${c?.title ?? APPLICATION_KINDS[a.kind ?? 'professional']} (csoport nélkül)`;
  }
  const g = await req.payload.findByID({ collection: 'courseGroups', id: groupId, depth: 0, req, disableErrors: true });
  return g?.title ?? '';
}

/**
 * Every sign-up: a Nyitott Műhely date, a beginner course, or a professional application. Created
 * by the site's forms (lib/applications) or by staff; the person's account is always set.
 * At most one active application per person and date / course (database guard, see the migration);
 * places are counted under a row lock.
 */
export const Applications: CollectionConfig = {
  slug: 'applications',
  labels: { singular: 'Jelentkezés', plural: 'Összes jelentkezés' },
  access: {
    // their own for the student area; everything else goes through the server code
    read: ({ req: { user } }) =>
      userIsStaffOrAdmin(user) ? true : user ? ({ user: { equals: user.id } } satisfies Where) : false,
    create: isStaffOrAdmin,
    update: isStaffOrAdmin,
    delete: isStaffOrAdmin,
  },
  admin: {
    useAsTitle: 'displayTitle',
    defaultColumns: ['name', 'kind', 'target', 'status', 'createdAt', 'paidOffline'],
    listSearchableFields: ['name', 'email', 'target'],
    description:
      'Minden jelentkezés: Nyitott Műhely alkalmak, kezdő kurzusok, szakmai pályázatok. A résztvevők a fiókjuk áttekintőjén (/fiokom) követik.',
  },
  defaultSort: '-createdAt',
  hooks: {
    // the places left on the public pages
    ...collectionRevalidation('applications'),
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const before = (originalDoc ?? {}) as ApplicationDoc;
        const a = { ...before, ...(data as ApplicationDoc) };
        const kind = a.kind;
        if (!kind) return fail('kind', 'Válaszd ki a jelentkezés fajtáját.', req);
        if (operation === 'create' && !data.status) data.status = initialStatus(kind);
        const status = (data.status ?? a.status) as ApplicationStatus;
        if (!statusesOf(kind).includes(status))
          fail('status', 'Ez az állapot ennél a jelentkezésnél nem választható.', req);
        if (!relId(a.user)) fail('user', 'Add meg, ki jelentkezik.', req);
        if (kind === 'workshop') {
          if (!relId(a.session)) fail('session', 'Válaszd ki az alkalmat.', req);
          data.courseGroup = null;
        } else {
          if (kind === 'beginner' && !relId(a.courseGroup) && !relId(a.course))
            fail('courseGroup', 'Válaszd ki a csoportot vagy a kurzust.', req);
          data.session = null;
          // the group's course, so a group-less application and a placed one point to the same course
          const groupId = relId(a.courseGroup);
          if (groupId && relId(data.courseGroup) !== relId(before.courseGroup)) {
            const g = await req.payload.findByID({
              collection: 'courseGroups',
              id: groupId,
              depth: 0,
              req,
              disableErrors: true,
            });
            if (relId(g?.course)) data.course = relId(g?.course);
          }
          a.course = data.course ?? a.course;
        }
        // one active application per person and date / course (the unique indexes are the guarantee)
        if (isActive(status) && (!isActive(before.status as ApplicationStatus) || !sameTargetOf(before, a))) {
          const target: Where =
            a.kind === 'workshop'
              ? { session: { equals: relId(a.session) } }
              : relId(a.courseGroup)
                ? { courseGroup: { equals: relId(a.courseGroup) } }
                : {
                    and: [
                      { courseGroup: { exists: false } },
                      { kind: { equals: a.kind } },
                      { course: relId(a.course) ? { equals: relId(a.course) } : { exists: false } },
                    ],
                  };
          const { totalDocs } = await req.payload.count({
            collection: 'applications',
            where: {
              and: [
                { user: { equals: relId(a.user) } },
                target,
                { status: { in: [...ACTIVE_STATUSES] } },
                ...(before.id ? [{ id: { not_equals: before.id } }] : []),
              ],
            },
            req,
          });
          if (totalDocs)
            fail(
              a.kind === 'workshop' ? 'session' : 'courseGroup',
              a.kind === 'workshop' ? 'Erre az alkalomra már jelentkeztél.' : 'Erre a kurzusra már jelentkeztél.',
              req,
            );
        }
        // a place is taken (again — also a hold that ran out, then paid): count under a lock
        const takes = (PLACE_STATUSES as readonly string[]).includes(status);
        const took =
          operation === 'update' &&
          takesPlace(
            before.status as ApplicationStatus,
            before.holdUntil ? new Date(before.holdUntil) : null,
            new Date(),
          );
        if (takes && (!took || !sameTargetOf(before, a)) && (await placesLeftFor(req, a, before.id)) === 0)
          fail(
            a.kind === 'workshop' ? 'session' : 'courseGroup',
            a.kind === 'workshop' ? 'Ez az alkalom megtelt.' : 'Ez a kurzus megtelt.',
            req,
          );

        if (CLOSED.includes(status) && before.status !== status) data.cancelledAt ??= new Date().toISOString();
        const target = await targetOf(req, a);
        data.target = target;
        data.displayTitle = `${a.name ?? ''} — ${target}`;
        return data;
      },
    ],
  },
  fields: [
    { name: 'displayTitle', label: 'Megnevezés', type: 'text', admin: { readOnly: true, hidden: true } },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          label: 'Fajta',
          type: 'select',
          required: true,
          index: true,
          options: options(APPLICATION_KINDS),
        },
        {
          name: 'status',
          label: 'Állapot',
          type: 'select',
          index: true,
          options: options({ ...SIGNUP_STATUSES, ...REVIEW_STATUSES }),
          admin: {
            description:
              'Nyitott Műhely és kezdő: Fizetésre vár / Jelentkezett (fizetett) / Lemondva / Áthelyezve. Szakmai: Új / Interjú / Felvéve / Elutasítva / Visszavonta.',
          },
        },
      ],
    },
    { ...relationship('user', 'Fiók', 'users', { required: true }), index: true },
    {
      ...relationship('session', 'Alkalom', 'sessions'),
      index: true,
      filterOptions: { kind: { equals: 'workshop' } },
      admin: { condition: (_, s) => s?.kind === 'workshop' },
    },
    {
      ...relationship('courseGroup', 'Kurzus (csoport)', 'courseGroups', {
        description: 'Üresen: csoport nélküli jelentkezés — felvételkor kell kiválasztani.',
      }),
      index: true,
      admin: { condition: (_, s) => s?.kind === 'beginner' || s?.kind === 'professional' },
    },
    {
      ...relationship('show', 'Előadás-időpont', 'shows'),
      index: true,
      admin: { condition: (_, s) => s?.kind === 'show' },
    },
    {
      name: 'seats',
      label: 'Jegyek',
      type: 'number',
      min: 1,
      defaultValue: 1,
      admin: { condition: (_, s) => s?.kind === 'show' },
    },
    {
      ...relationship('course', 'Kurzus', 'courses', {
        description: 'Automatikus a csoportból; csoport nélküli jelentkezésnél ez mondja meg, melyik kurzusra.',
      }),
      index: true,
      admin: { condition: (_, s) => s?.kind === 'beginner' || s?.kind === 'professional' },
    },
    { name: 'target', label: 'Mire', type: 'text', admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        text('name', 'Név', { required: true }),
        { name: 'email', label: 'E-mail', type: 'email', required: true },
        text('phone', 'Telefon'),
      ],
    },
    textarea('message', 'Üzenet', { description: 'Szakmainál: motiváció és tapasztalat.' }),
    {
      type: 'row',
      fields: [
        {
          ...relationship('movedTo', 'Áthelyezve ide', 'applications'),
          admin: { readOnly: true, condition: (_, s) => s?.status === 'moved' },
        },
        { ...text('cancelReason', 'Lemondás oka'), admin: { condition: (_, s) => s?.status === 'cancelled' } },
        {
          name: 'cancelledAt',
          label: 'Lemondva / lezárva',
          type: 'date',
          admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy. MM. dd. HH:mm' } },
        },
      ],
    },
    {
      ...relationship('order', 'Rendelés', 'orders'),
      admin: { readOnly: true, position: 'sidebar', condition: (_, s) => Boolean(s?.order) },
    },
    {
      name: 'holdUntil',
      label: 'Fizetésre vár eddig',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (_, s) => s?.status === 'held',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy. MM. dd. HH:mm' },
        description: 'Addig tartjuk a helyet, amíg a fizetés lezajlik.',
      },
    },
    {
      name: 'paidOffline',
      label: 'Fizetve',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Átutalás / készpénz — ha nem online fizetett.' },
    },
    {
      ...text('paymentNote', 'Fizetés megjegyzés', { description: 'Pl. „átutalta 10.12.”' }),
      admin: { position: 'sidebar' },
    },
    textarea('staffNotes', 'Belső megjegyzés', { description: 'Csak a munkatársak látják.' }),
  ],
};
