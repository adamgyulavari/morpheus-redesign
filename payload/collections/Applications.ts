import { sql } from '@payloadcms/db-postgres';
import type { CollectionConfig, PayloadRequest, Where } from 'payload';

import {
  APPLICATION_KINDS,
  type ApplicationKind,
  type ApplicationStatus,
  REVIEW_STATUSES,
  SIGNUP_STATUSES,
} from '@/lib/applications/labels';
import { ACTIVE_STATUSES, COUNTED_STATUSES, isActive, isCounted, placesLeft } from '@/lib/applications/rules';
import { whenText } from '@/lib/rooms/format';
import { options } from '@/lib/rooms/labels';

import { isStaffOrAdmin, userIsStaffOrAdmin } from '../access';
import { dbOf } from '../db';
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
  name?: string;
};

const fail = failer('applications');

const sameTargetOf = (a: ApplicationDoc, b: ApplicationDoc) =>
  relId(a.session) === relId(b.session) && relId(a.courseGroup) === relId(b.courseGroup);

const SIGNUP = Object.keys(SIGNUP_STATUSES) as ApplicationStatus[];
const REVIEW = Object.keys(REVIEW_STATUSES) as ApplicationStatus[];
export const statusesOf = (kind: ApplicationKind) => (kind === 'professional' ? REVIEW : SIGNUP);
export const initialStatus = (kind: ApplicationKind): ApplicationStatus =>
  kind === 'professional' ? 'new' : 'registered';

const inList = (list: readonly string[]) =>
  sql.join(
    list.map((s) => sql`${s}`),
    sql`, `,
  );

/**
 * Takes a place, or refuses: locks the session or course group row (SELECT … FOR UPDATE) in the
 * save's transaction, so two people can't take the last place at once, then counts.
 */
async function checkCapacity(req: PayloadRequest, a: ApplicationDoc, ownId: number | undefined) {
  const db = await dbOf(req.payload, req);
  const sessionId = a.kind === 'workshop' ? relId(a.session) : null;
  const groupId = a.kind === 'beginner' ? relId(a.courseGroup) : null;
  if (!sessionId && !groupId) return;
  const { rows } = sessionId
    ? await db.execute(sql`SELECT workshop_max_participants AS max FROM sessions WHERE id = ${sessionId} FOR UPDATE`)
    : await db.execute(sql`SELECT signup_capacity AS max FROM course_groups WHERE id = ${groupId} FOR UPDATE`);
  const max = rows[0]?.max == null ? null : Number(rows[0].max);
  if (max == null) return;
  const target = sessionId ? sql`session_id = ${sessionId}` : sql`course_group_id = ${groupId}`;
  const { rows: count } = await db.execute(sql`
    SELECT count(*)::int AS n FROM applications
    WHERE ${target} AND status IN (${inList(COUNTED_STATUSES)}) AND id <> ${ownId ?? 0}`);
  if (placesLeft(max, Number(count[0]?.n ?? 0)) === 0)
    fail(sessionId ? 'session' : 'courseGroup', sessionId ? 'Ez az alkalom megtelt.' : 'Ez a kurzus megtelt.', req);
}

/** "Nyitott Műhely, okt. 18., szo 10:00–13:00" or the group's name. */
async function targetOf(req: PayloadRequest, a: ApplicationDoc): Promise<string> {
  const sessionId = relId(a.session);
  if (a.kind === 'workshop' && sessionId) {
    const s = await req.payload.findByID({ collection: 'sessions', id: sessionId, depth: 0, req, disableErrors: true });
    return s ? `${s.displayTitle}, ${whenText(s.start, s.end)}` : '';
  }
  const groupId = relId(a.courseGroup);
  if (!groupId) return 'Szakmai kurzus (csoport nélkül)';
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
  labels: { singular: 'Jelentkezés', plural: 'Jelentkezések' },
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
    group: 'Jelentkezések',
    listSearchableFields: ['name', 'email', 'target'],
    description:
      'Minden jelentkezés: Nyitott Műhely alkalmak, kezdő kurzusok, szakmai pályázatok. A résztvevők a fiókjukban (/fiokom/jelentkezeseim) követik.',
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
          if (kind === 'beginner' && !relId(a.courseGroup)) fail('courseGroup', 'Válaszd ki a kurzust.', req);
          data.session = null;
        }
        // one active application per person and date / course (the unique indexes are the guarantee)
        if (isActive(status) && (!isActive(before.status as ApplicationStatus) || !sameTargetOf(before, a))) {
          const target: Where =
            a.kind === 'workshop'
              ? { session: { equals: relId(a.session) } }
              : { courseGroup: relId(a.courseGroup) ? { equals: relId(a.courseGroup) } : { exists: false } };
          const { totalDocs } = await req.payload.count({
            collection: 'applications',
            where: {
              and: [
                { user: { equals: relId(a.user) } },
                target,
                { status: { in: [...ACTIVE_STATUSES] } },
                ...(a.kind === 'professional' && !relId(a.courseGroup) ? [{ kind: { equals: 'professional' } }] : []),
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
        // a place is taken (again): count under a lock
        const counted = isCounted(status);
        const wasCounted = operation === 'update' && isCounted(before.status as ApplicationStatus);
        if (counted && (!wasCounted || !sameTargetOf(before, a))) await checkCapacity(req, { ...a, status }, before.id);

        if ((status === 'cancelled' || status === 'withdrawn' || status === 'moved') && before.status !== status)
          data.cancelledAt ??= new Date().toISOString();
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
              'Nyitott Műhely és kezdő: Jelentkezett / Lemondva / Áthelyezve. Szakmai: Új / Interjú / Felvéve / Elutasítva / Visszavonta.',
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
        description: 'Szakmainál nem kötelező: felvételkor kell kiválasztani.',
      }),
      index: true,
      admin: { condition: (_, s) => s?.kind && s.kind !== 'workshop' },
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
      name: 'paidOffline',
      label: 'Fizetve',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Átutalás / készpénz (az online fizetésig).' },
    },
    {
      ...text('paymentNote', 'Fizetés megjegyzés', { description: 'Pl. „átutalta 10.12.”' }),
      admin: { position: 'sidebar' },
    },
    textarea('staffNotes', 'Belső megjegyzés', { description: 'Csak a munkatársak látják.' }),
  ],
};
