import type { CollectionConfig, PayloadRequest } from 'payload';

import { BOOKING_KINDS, options } from '@/lib/rooms/labels';
import { notifyPractice } from '@/lib/rooms/notify';
import { clashMessage, findClashes, roomNames, syncOccupancy } from '@/lib/rooms/occupancy';

import { dateTime, relationship, text, textarea } from '../fields';
import { type Rel, relId, relIds } from '../rel';
import { blockingClashes, failer, mayOverridePractice, overridePracticeField } from './placement';
import { ROOMS_GROUP, staffOnly } from './Rooms';

type BookingDoc = {
  id?: number;
  rooms?: Rel[];
  start?: string;
  end?: string;
  kind?: keyof typeof BOOKING_KINDS;
  session?: Rel;
  title?: string | null;
  user?: Rel;
  courseGroup?: Rel;
  production?: Rel;
  status?: 'confirmed' | 'cancelled';
  displayTitle?: string;
  overridePractice?: boolean;
};

const fail = failer('roomBookings');

/** "Gyakorlás — Teszt Anna", the rental's title, or the session's (passed in by the session). */
async function titleOf(b: BookingDoc, req: PayloadRequest): Promise<string> {
  if (b.title) return b.title;
  const userId = relId(b.user);
  if (b.kind === 'practice' && userId) {
    const user = await req.payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      req,
      disableErrors: true,
    });
    return `${BOOKING_KINDS.practice} — ${user?.name ?? ''}`.trim();
  }
  return BOOKING_KINDS[b.kind ?? 'other'];
}

/**
 * One or more rooms for a time range: a session's place, a student's practice, a rental, other.
 * Confirmed bookings never overlap in a room — guaranteed by the database (lib/rooms/occupancy.ts).
 */
export const RoomBookings: CollectionConfig = {
  slug: 'roomBookings',
  labels: { singular: 'Teremfoglalás', plural: 'Teremfoglalások' },
  access: staffOnly,
  admin: {
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'kind', 'start', 'end', 'rooms', 'status'],
    group: ROOMS_GROUP,
    description:
      'Ki és mi foglal termet. Az alkalmak (órák, próbák) foglalását az alkalom kezeli; itt a bérléseket, egyéb foglalásokat és a diákok gyakorlásait látod.',
  },
  defaultSort: '-start',
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const b = { ...(originalDoc as BookingDoc | undefined), ...(data as BookingDoc) };
        const start = new Date(b.start ?? '');
        const end = new Date(b.end ?? '');
        if (!(end > start)) fail('end', 'A vége legyen a kezdés után.', req);
        const rooms = relIds(b.rooms);
        if (!rooms.length) fail('rooms', 'Válassz legalább egy termet.', req);
        if (b.kind === 'session' && !relId(b.session))
          fail('session', 'Az alkalom foglalásához tartozik alkalom.', req);
        if (b.kind === 'practice' && !relId(b.user)) fail('user', 'A gyakorláshoz add meg, ki foglal.', req);
        if (relId(b.courseGroup) && relId(b.production))
          fail('production', 'Csoport vagy előadás — csak az egyik.', req);
        if ((b.kind === 'rental' || b.kind === 'other') && !b.title) fail('title', 'Adj címet a foglalásnak.', req);

        if (b.status === 'cancelled' && (originalDoc as BookingDoc | undefined)?.status !== 'cancelled') {
          data.cancelledAt ??= new Date().toISOString();
          data.cancelledBy ??= req.user?.id ?? null;
        }
        data.displayTitle = await titleOf(b, req);

        if (b.status !== 'cancelled') {
          const clashes = await blockingClashes(req, rooms, start, end, (originalDoc as BookingDoc | undefined)?.id, b);
          if (clashes.length) fail('rooms', clashMessage(clashes), req);
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const b = doc as BookingDoc & { id: number };
        const rooms = relIds(b.rooms);
        const start = new Date(b.start ?? '');
        const end = new Date(b.end ?? '');
        if (b.status === 'confirmed' && mayOverridePractice(req, b)) {
          // an admin placed this over student practice: cancel those (they get an e-mail)
          const clashes = await findClashes(req.payload, req, rooms, start, end, [b.id]);
          for (const id of new Set(clashes.filter((c) => c.kind === 'practice').map((c) => c.bookingId))) {
            await req.payload.update({
              collection: 'roomBookings',
              id,
              data: { status: 'cancelled', cancelReason: `Az adminisztrátor felülírta: ${b.displayTitle}` },
              req,
              overrideAccess: true,
            });
          }
        }
        await syncOccupancy(
          req.payload,
          req,
          { id: b.id, rooms, start, end, confirmed: b.status === 'confirmed' },
          () => roomNames(req.payload, rooms, req),
        );
        // the student hears about their practice (confirmed, changed, cancelled — with the reason)
        await notifyPractice(req, doc, operation === 'update' ? previousDoc : undefined, operation);
        return doc;
      },
    ],
    afterDelete: [
      // the rows go with the booking (foreign key); a session whose booking is deleted here loses its place
      async ({ doc, req }) => {
        const session = relId((doc as BookingDoc).session);
        if (session && req.context.releasingBookingOf !== session) {
          await req.payload.db.updateOne({
            collection: 'sessions',
            id: session,
            data: { locationType: 'unplaced', booking: null },
            req,
          });
        }
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
          label: 'Típus',
          type: 'select',
          required: true,
          defaultValue: 'rental',
          options: options(BOOKING_KINDS),
        },
        {
          name: 'status',
          label: 'Állapot',
          type: 'select',
          required: true,
          defaultValue: 'confirmed',
          options: [
            { label: 'Érvényes', value: 'confirmed' },
            { label: 'Lemondva', value: 'cancelled' },
          ],
        },
      ],
    },
    relationship('rooms', 'Termek', 'rooms', { hasMany: true, required: true }),
    {
      type: 'row',
      fields: [dateTime('start', 'Kezdés', { required: true }), dateTime('end', 'Vége', { required: true })],
    },
    {
      ...text('title', 'Cím', {
        description: 'Bérlésnél és egyéb foglalásnál kötelező, pl. „Bérlés: XY tánccsoport”.',
      }),
      admin: { condition: (_, s) => s?.kind !== 'session' },
    },
    {
      ...relationship('session', 'Alkalom', 'sessions'),
      admin: {
        condition: (_, s) => s?.kind === 'session',
        readOnly: true,
        description: 'Az alkalom kezeli ezt a foglalást.',
      },
    },
    {
      ...relationship('user', 'Foglaló', 'users'),
      admin: { condition: (_, s) => s?.kind === 'practice' },
    },
    {
      type: 'row',
      admin: { condition: (_, s) => s?.kind === 'practice' },
      fields: [
        relationship('courseGroup', 'Mihez gyakorol: csoport', 'courseGroups'),
        relationship('production', 'Mihez gyakorol: előadás', 'productions'),
      ],
    },
    {
      type: 'collapsible',
      label: 'Lemondás',
      admin: { condition: (_, s) => s?.status === 'cancelled', initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            { ...relationship('cancelledBy', 'Lemondta', 'users'), admin: { readOnly: true } },
            { ...dateTime('cancelledAt', 'Lemondás ideje'), admin: { readOnly: true } },
          ],
        },
        textarea('cancelReason', 'Lemondás oka'),
      ],
    },
    {
      name: 'note',
      label: 'Megjegyzés a foglalótól',
      type: 'textarea',
      admin: {
        condition: (_, s) => s?.kind === 'practice',
        description: 'A diák írja foglaláskor; csak ő és a munkatársak látják.',
      },
    },
    textarea('notes', 'Belső megjegyzés', { description: 'Csak a munkatársak látják.' }),
    overridePracticeField(
      'Csak adminisztrátor: az ütköző diák-gyakorlásokat lemondja (a diákok e-mailt kapnak). Alkalommal és bérléssel ütközni nem lehet.',
    ),
  ],
};
