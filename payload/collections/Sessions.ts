import type { CollectionConfig, PayloadRequest } from 'payload';
import { WORKSHOP_STATUSES } from '@/lib/applications/labels';
import { cutoffAt } from '@/lib/applications/rules';
import { applicationSettings } from '@/lib/applications/settings';
import { LOCATION_TYPES, options, SESSION_KINDS } from '@/lib/rooms/labels';
import { notifySessionChange } from '@/lib/rooms/notify';
import { clashMessage } from '@/lib/rooms/occupancy';
import { isStaffOrAdminField } from '@/payload/access';

import { dateTime, relationship, text, textarea } from '../fields';
import { type Rel, relId, relIds } from '../rel';
import { blockingClashes, failer, mayOverridePractice, overridePracticeField } from './placement';
import { ROOMS_GROUP, staffOnly } from './Rooms';

export type SessionDoc = {
  id?: number;
  title?: string | null;
  displayTitle?: string;
  kind?: keyof typeof SESSION_KINDS;
  courseGroup?: Rel;
  production?: Rel;
  start?: string;
  end?: string;
  locationType?: keyof typeof LOCATION_TYPES;
  rooms?: Rel[];
  booking?: Rel;
  externalLocation?: string | null;
  status?: 'scheduled' | 'cancelled';
  generatedFrom?: { courseGroup?: Rel; entry?: number | null; day?: string | null } | null;
  customized?: boolean;
  overridePractice?: boolean;
  workshop?: { minParticipants?: number | null; maxParticipants?: number | null } | null;
};

const fail = failer('sessions');

/** The title, or the group's / production's name ("Keddi szakmai II." / "Az ördög — próba"). */
async function titleOf(s: SessionDoc, req: PayloadRequest): Promise<string> {
  if (s.title) return s.title;
  const kind = SESSION_KINDS[s.kind ?? 'other'];
  const group = relId(s.courseGroup);
  const production = relId(s.production);
  const owner = group
    ? await req.payload.findByID({
        collection: 'courseGroups',
        id: group,
        depth: 0,
        req,
        disableErrors: true,
        select: { title: true },
      })
    : production
      ? await req.payload.findByID({
          collection: 'productions',
          id: production,
          depth: 0,
          draft: true,
          req,
          disableErrors: true,
          select: { title: true },
        })
      : null;
  if (!owner?.title) return kind;
  return s.kind === 'course' ? owner.title : `${owner.title} — ${kind.toLowerCase()}`;
}

const sameIds = (a: unknown, b: unknown) => relIds(a).sort().join() === relIds(b).sort().join();
const sameTime = (a?: string | null, b?: string | null) =>
  (a ? new Date(a).getTime() : null) === (b ? new Date(b).getTime() : null);

/** Changes that make a generated session "customized" (fill month then leaves it alone). */
function edited(before: SessionDoc, after: SessionDoc): boolean {
  return (
    !sameTime(before.start, after.start) ||
    !sameTime(before.end, after.end) ||
    !sameIds(before.rooms, after.rooms) ||
    before.locationType !== after.locationType ||
    before.status !== after.status ||
    (before.externalLocation ?? '') !== (after.externalLocation ?? '') ||
    (before.title ?? '') !== (after.title ?? '')
  );
}

/**
 * What happens when: a course meeting, a rehearsal, an exam, a show. It belongs to a course group
 * or a production, and has one place — a room booking it owns, an external place, or none yet.
 *
 * The session owns the time: its booking follows it in the same transaction. Placing it in rooms
 * that are taken is refused; if only its time changes and the new time clashes, it keeps the time,
 * releases its booking and becomes "unplaced" (staff place it again from the room calendar).
 */
export const Sessions: CollectionConfig = {
  slug: 'sessions',
  labels: { singular: 'Alkalom', plural: 'Alkalmak' },
  access: staffOnly,
  admin: {
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'kind', 'start', 'locationType', 'status'],
    group: ROOMS_GROUP,
    description: 'Órák, próbák, vizsgák, előadások. A helyszín: terem (foglalással), külső helyszín vagy még nincs.',
    listSearchableFields: ['displayTitle', 'title'],
  },
  defaultSort: 'start',
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const before = (originalDoc ?? {}) as SessionDoc;
        const s = { ...before, ...(data as SessionDoc) };
        const start = new Date(s.start ?? '');
        const end = new Date(s.end ?? '');
        if (!(end > start)) fail('end', 'A vége legyen a kezdés után.', req);

        const owners = [relId(s.courseGroup), relId(s.production)].filter(Boolean).length;
        if ((s.kind === 'course' || s.kind === 'rehearsal') && owners !== 1) {
          fail(
            s.kind === 'course' ? 'courseGroup' : 'production',
            'Óránál és próbánál pontosan egy csoport vagy előadás kell.',
            req,
          );
        }
        if (owners > 1) fail('production', 'Csoport vagy előadás — csak az egyik.', req);
        if (s.kind === 'workshop') {
          if (owners) fail('courseGroup', 'A nyitott műhely alkalom nem tartozik csoporthoz vagy előadáshoz.', req);
          const w = s.workshop ?? {};
          if (w.maxParticipants != null && w.minParticipants != null && w.maxParticipants < w.minParticipants)
            fail('workshop.maxParticipants', 'A maximum ne legyen kisebb a minimumnál.', req);
        }
        if (s.locationType === 'external' && !s.externalLocation?.trim())
          fail('externalLocation', 'Add meg a külső helyszínt.', req);

        // the box applies to the booking this session creates or moves, too
        if (mayOverridePractice(req, s)) req.context.overridePractice = true;
        data.displayTitle = await titleOf(s, req);
        if (operation === 'update' && s.generatedFrom?.courseGroup && !req.context.generating && edited(before, s)) {
          data.customized = true;
        }

        // placement
        if (s.locationType === 'room' && s.status !== 'cancelled') {
          const rooms = relIds(s.rooms);
          if (!rooms.length) fail('rooms', 'Válassz termet, vagy állítsd a helyszínt „Helyszín nélkül”-re.', req);
          const clashes = await blockingClashes(req, rooms, start, end, relId(before.booking), s);
          if (clashes.length) {
            const placing = operation === 'create' || before.locationType !== 'room' || !sameIds(before.rooms, s.rooms);
            if (placing && !req.context.generating) {
              fail('rooms', clashMessage(clashes), req);
            }
            // only the time changed (or fill month): keep it, without a place
            data.locationType = 'unplaced';
          }
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const s = doc as SessionDoc & { id: number };
        const bookingId = relId(s.booking);
        if (s.locationType === 'room' && s.status === 'scheduled') {
          const booking = {
            kind: 'session' as const,
            session: s.id,
            rooms: relIds(s.rooms),
            start: String(s.start),
            end: String(s.end),
            status: 'confirmed' as const,
            title: s.displayTitle,
          };
          if (bookingId) {
            await req.payload.update({
              collection: 'roomBookings',
              id: bookingId,
              data: booking,
              req,
              overrideAccess: true,
            });
          } else {
            const created = await req.payload.create({
              collection: 'roomBookings',
              data: booking,
              req,
              overrideAccess: true,
            });
            await req.payload.db.updateOne({ collection: 'sessions', id: s.id, data: { booking: created.id }, req });
            s.booking = created.id;
          }
        } else if (bookingId) {
          await releaseBooking(req, s.id, bookingId);
          s.booking = null;
        }
        // its students hear about a cancellation, a new time or a new place
        await notifySessionChange(req, s, operation === 'update' ? previousDoc : undefined, operation);
        return s;
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const bookingId = relId((doc as SessionDoc).booking);
        if (bookingId) await releaseBooking(req, (doc as { id: number }).id, bookingId, false);
      },
    ],
  },
  fields: [
    { name: 'displayTitle', label: 'Megnevezés', type: 'text', index: true, admin: { readOnly: true, hidden: true } },
    text('title', 'Cím', { description: 'Üresen a csoport vagy az előadás nevéből készül.' }),
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          label: 'Típus',
          type: 'select',
          required: true,
          defaultValue: 'course',
          options: options(SESSION_KINDS),
        },
        {
          name: 'status',
          label: 'Állapot',
          type: 'select',
          required: true,
          defaultValue: 'scheduled',
          options: [
            { label: 'Lesz', value: 'scheduled' },
            { label: 'Elmarad', value: 'cancelled' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        relationship('courseGroup', 'Csoport', 'courseGroups', { description: 'Óránál kötelező.' }),
        relationship('production', 'Előadás (darab)', 'productions', { description: 'Próbánál kötelező.' }),
      ],
    },
    {
      type: 'row',
      fields: [dateTime('start', 'Kezdés', { required: true }), dateTime('end', 'Vége', { required: true })],
    },
    {
      name: 'locationType',
      label: 'Helyszín',
      type: 'select',
      required: true,
      defaultValue: 'room',
      index: true,
      options: options(LOCATION_TYPES),
    },
    {
      ...relationship('rooms', 'Termek', 'rooms', { hasMany: true }),
      admin: {
        condition: (_, s) => s?.locationType !== 'external',
        description: 'Ahol lesz. „Helyszín nélkül” állapotban ezeket a termeket próbálja meg újra, amikor elhelyezed.',
      },
    },
    { ...text('externalLocation', 'Külső helyszín'), admin: { condition: (_, s) => s?.locationType === 'external' } },
    {
      ...relationship('booking', 'Teremfoglalás', 'roomBookings'),
      admin: { readOnly: true, position: 'sidebar', description: 'Automatikus: az alkalom ideje és termei szerint.' },
    },
    textarea('notes', 'Belső megjegyzés', { description: 'Csak a munkatársak látják.' }),
    {
      name: 'workshop',
      label: 'Nyitott Műhely',
      type: 'group',
      admin: {
        condition: (_, s) => s?.kind === 'workshop',
        description:
          'Jelentkezés a weboldalon (/nyitott-alkalmak). A határidőkor a rendszer dönt: elég jelentkező esetén biztosan indul, különben elmarad.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'price', label: 'Ár (Ft)', type: 'number', min: 0 },
            { name: 'minParticipants', label: 'Minimum létszám', type: 'number', min: 1, defaultValue: 5 },
            { name: 'maxParticipants', label: 'Maximum létszám', type: 'number', min: 1, defaultValue: 16 },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'bookable',
              label: 'Jelentkezni lehet',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Kikapcsolva nem jelenik meg jelentkezhetőként.' },
            },
            {
              name: 'workshopStatus',
              label: 'Indulás',
              type: 'select',
              defaultValue: 'open',
              index: true,
              options: options(WORKSHOP_STATUSES),
              admin: { description: 'A határidőkor automatikusan változik.' },
            },
          ],
        },
        textarea('description', 'Leírás', { description: 'Rövid szöveg a jelentkezéshez (miről szól az alkalom).' }),
        {
          name: 'cutoffAt',
          label: 'Döntés az indulásról',
          type: 'date',
          virtual: true,
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy. MM. dd. HH:mm' },
            description: 'A kezdés előtt ennyivel (Jelentkezési beállítások) dől el, hogy indul-e.',
          },
          hooks: {
            afterRead: [
              async ({ data, req }) =>
                data?.kind === 'workshop' && data.start
                  ? cutoffAt(
                      new Date(String(data.start)),
                      (await applicationSettings(req)).workshopCutoffHours,
                    ).toISOString()
                  : null,
            ],
          },
        },
      ],
    },
    {
      name: 'applications',
      label: 'Jelentkezők',
      type: 'join',
      collection: 'applications',
      on: 'session',
      defaultSort: 'createdAt',
      access: { read: isStaffOrAdminField },
      admin: {
        condition: (_, s) => s?.kind === 'workshop',
        defaultColumns: ['name', 'email', 'phone', 'status', 'paidOffline'],
      },
    },
    {
      name: 'generatedFrom',
      label: 'Hónap feltöltéséből',
      type: 'group',
      admin: { position: 'sidebar', condition: (_, s) => Boolean(s?.generatedFrom?.courseGroup) },
      fields: [
        { ...relationship('courseGroup', 'Csoport', 'courseGroups'), index: true, admin: { readOnly: true } },
        { name: 'entry', label: 'Órarend-sor', type: 'number', admin: { readOnly: true } },
        { name: 'day', label: 'Eredeti nap', type: 'text', index: true, admin: { readOnly: true } },
      ],
    },
    {
      name: 'customized',
      label: 'Kézzel módosítva',
      type: 'checkbox',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'A hónap újbóli feltöltése és a generált alkalmak törlése nem nyúl hozzá.',
      },
    },
    overridePracticeField('Csak adminisztrátor: az ütköző diák-gyakorlásokat lemondja (a diákok e-mailt kapnak).'),
  ],
};

/** Deletes a session's booking (its own; not a "the booking was removed" event for the session). */
async function releaseBooking(req: PayloadRequest, sessionId: number, bookingId: number, unlink = true) {
  const previous = req.context.releasingBookingOf;
  req.context.releasingBookingOf = sessionId;
  try {
    await req.payload.delete({ collection: 'roomBookings', id: bookingId, req, overrideAccess: true });
  } finally {
    req.context.releasingBookingOf = previous;
  }
  if (unlink) await req.payload.db.updateOne({ collection: 'sessions', id: sessionId, data: { booking: null }, req });
}
