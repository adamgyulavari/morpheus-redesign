/**
 * E-mails of the room calendar, sent from the save hooks (payload/collections/RoomBookings.ts,
 * Sessions.ts), in the shared layout (payload/email.ts):
 * - practice booking confirmed (with an .ics), changed by staff, cancelled (by the student, or by
 *   staff / an admin override — with the reason; the .ics removes it from the calendar);
 * - a session cancelled, reinstated, moved or placed elsewhere: one e-mail per student of its
 *   group (or of the groups playing its production) per save, with old and new details.
 *   Not for sessions created by fill month, nor more than 30 days ahead, nor in the past.
 * A failed e-mail never fails the save; it is logged.
 */
import type { PayloadRequest } from 'payload';
import { emailLayout, siteUrl } from '@/payload/email';
import { relId, relIds } from '@/payload/rel';

import { whenText } from './format';
import { icsFile } from './ics';
import { BOOKING_KINDS } from './labels';
import { placeOf, roomNames } from './occupancy';

const HORIZON_MS = 30 * 86_400_000;
const STUDIO = 'Morpheus Színműhely';

type Doc = Record<string, unknown>;
type Recipient = { id: number; email: string; firstName?: string | null };

const hello = (u: Recipient) => (u.firstName ? `Kedves ${u.firstName}!` : 'Kedves Hallgatónk!');

async function send(
  req: PayloadRequest,
  to: Recipient[],
  build: (u: Recipient) => { subject: string; html: string; ics?: string },
) {
  const results = await Promise.allSettled(
    to.map((u) => {
      const { subject, html, ics } = build(u);
      return req.payload.sendEmail({
        to: u.email,
        subject,
        html,
        ...(ics
          ? {
              attachments: [
                { filename: 'foglalas.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' },
              ],
            }
          : {}),
      });
    }),
  );
  for (const r of results)
    if (r.status === 'rejected') req.payload.logger.error({ err: r.reason, msg: 'room calendar e-mail failed' });
}

// ── practice bookings ───────────────────────────────────────────────────────

export async function notifyPractice(
  req: PayloadRequest,
  doc: Doc,
  previous: Doc | undefined,
  operation: 'create' | 'update',
) {
  try {
    if (doc.kind !== 'practice') return;
    const userId = relId(doc.user);
    if (!userId) return;
    const user = (await req.payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      req,
      disableErrors: true,
    })) as Recipient | null;
    if (!user?.email) return;

    const start = new Date(String(doc.start));
    const end = new Date(String(doc.end));
    const rooms = await roomNames(req.payload, relIds(doc.rooms), req);
    const ownerId = relId(doc.courseGroup) ?? relId(doc.production);
    const owner = ownerId
      ? (
          await req.payload.findByID({
            collection: relId(doc.courseGroup) ? 'courseGroups' : 'productions',
            id: ownerId,
            depth: 0,
            req,
            disableErrors: true,
            ...(relId(doc.production) ? { draft: true } : {}),
          })
        )?.title
      : undefined;
    const uid = `booking-${doc.id}@morpheus-szinmuhely.hu`;
    const ics = (cancelled = false) =>
      icsFile({
        uid,
        start,
        end,
        summary: `${BOOKING_KINDS.practice}: ${rooms}`,
        location: `${STUDIO}, ${rooms}`,
        cancelled,
      });
    const details = [
      { label: 'Mikor', value: whenText(start, end, 'long') },
      { label: 'Hol', value: rooms },
      ...(owner ? [{ label: 'Mihez', value: String(owner) }] : []),
      ...(doc.note ? [{ label: 'Megjegyzés', value: String(doc.note) }] : []),
    ];
    const button = { label: 'Foglalásaim', href: siteUrl('/fiokom/terem') };

    const wasConfirmed = previous?.status === 'confirmed';
    if (operation === 'create' && doc.status === 'confirmed') {
      return await send(req, [user], (u) => ({
        subject: 'Teremfoglalás visszaigazolása',
        ics: ics(),
        html: emailLayout({
          preheader: `${whenText(start, end, 'long')} · ${rooms}`,
          heading: 'Lefoglaltad a termet',
          paragraphs: [hello(u), 'A teremfoglalásod rögzítettük. A csatolt fájllal felveheted a naptáradba.'],
          details,
          button,
          footnote: 'Ha mégsem jössz, mondd le a foglalást a fiókodban, hogy más használhassa a termet.',
        }),
      }));
    }
    if (wasConfirmed && doc.status === 'cancelled') {
      const byStaff = relId(doc.cancelledBy) !== userId;
      const reason = byStaff && doc.cancelReason ? String(doc.cancelReason) : undefined;
      return await send(req, [user], (u) => ({
        subject: 'Teremfoglalás lemondva',
        ics: ics(true),
        html: emailLayout({
          preheader: `${whenText(start, end, 'long')} · ${rooms}`,
          heading: 'Lemondott teremfoglalás',
          paragraphs: [
            hello(u),
            byStaff
              ? 'Sajnos le kellett mondanunk a teremfoglalásodat. Elnézést kérünk; kérjük, foglalj másik időpontot.'
              : 'Lemondtad a teremfoglalásodat. A terem újra szabad mások számára.',
          ],
          details: [...details, ...(reason ? [{ label: 'Ok', value: reason }] : [])],
          button,
        }),
      }));
    }
    // moved by staff
    const moved =
      wasConfirmed &&
      doc.status === 'confirmed' &&
      (String(previous?.start) !== String(doc.start) ||
        String(previous?.end) !== String(doc.end) ||
        relIds(previous?.rooms).join() !== relIds(doc.rooms).join());
    if (moved && previous) {
      const oldRooms = await roomNames(req.payload, relIds(previous.rooms), req);
      const oldWhen = whenText(new Date(String(previous.start)), new Date(String(previous.end)), 'long');
      return await send(req, [user], (u) => ({
        subject: 'Teremfoglalás módosítva',
        ics: ics(),
        html: emailLayout({
          preheader: `${whenText(start, end, 'long')} · ${rooms}`,
          heading: 'Módosult a teremfoglalásod',
          paragraphs: [hello(u), 'A munkatársaink módosították a teremfoglalásodat. Az új adatok:'],
          details: [
            {
              label: 'Mikor',
              value: whenText(start, end, 'long'),
              ...(oldWhen !== whenText(start, end, 'long') ? { was: oldWhen } : {}),
            },
            { label: 'Hol', value: rooms, ...(oldRooms !== rooms ? { was: oldRooms } : {}) },
          ],
          button,
        }),
      }));
    }
  } catch (err) {
    req.payload.logger.error({ err, msg: 'practice e-mail failed' });
  }
}

// ── sessions ────────────────────────────────────────────────────────────────

const placeOrPending = async (req: PayloadRequest, s: Doc) =>
  (await placeOf(req.payload, s, req)) ?? 'Helyszín egyeztetés alatt';

/** Students of the session's group, or of the groups playing its production. */
async function studentsOf(req: PayloadRequest, s: Doc): Promise<Recipient[]> {
  let groupIds: number[] = [];
  const group = relId(s.courseGroup);
  const production = relId(s.production);
  if (group) groupIds = [group];
  else if (production) {
    const p = await req.payload.findByID({
      collection: 'productions',
      id: production,
      depth: 0,
      draft: true,
      req,
      disableErrors: true,
    });
    groupIds = relIds(p?.courseGroups);
  }
  if (!groupIds.length) return [];
  const { docs: groups } = await req.payload.find({
    collection: 'courseGroups',
    where: { id: { in: groupIds } },
    depth: 0,
    req,
    limit: 0,
    pagination: false,
  });
  const ids = [...new Set(groups.flatMap((g) => relIds(g.students)))];
  if (!ids.length) return [];
  const { docs } = await req.payload.find({
    collection: 'users',
    where: { id: { in: ids } },
    depth: 0,
    req,
    limit: 0,
    pagination: false,
    select: { email: true, firstName: true },
  });
  return docs.map((u) => ({ id: u.id, email: u.email, firstName: u.firstName }));
}

export async function notifySessionChange(
  req: PayloadRequest,
  doc: Doc,
  previous: Doc | undefined,
  operation: 'create' | 'update',
) {
  try {
    if (operation !== 'update' || !previous || req.context.generating) return;
    const now = Date.now();
    const starts = [new Date(String(doc.start)).getTime(), new Date(String(previous.start)).getTime()];
    const ends = [new Date(String(doc.end)).getTime(), new Date(String(previous.end)).getTime()];
    // not more than 30 days ahead (neither the old nor the new time is near), not in the past
    if (Math.min(...starts) > now + HORIZON_MS || Math.max(...ends) < now) return;

    const cancelled = previous.status !== 'cancelled' && doc.status === 'cancelled';
    const reinstated = previous.status === 'cancelled' && doc.status === 'scheduled';
    const start = new Date(String(doc.start));
    const end = new Date(String(doc.end));
    const oldStart = new Date(String(previous.start));
    const oldEnd = new Date(String(previous.end));
    const timeChanged = start.getTime() !== oldStart.getTime() || end.getTime() !== oldEnd.getTime();
    const [place, oldPlace] = await Promise.all([placeOrPending(req, doc), placeOrPending(req, previous)]);
    const placeChanged = place !== oldPlace;
    if (!cancelled && !reinstated && !timeChanged && !placeChanged) return;

    const to = await studentsOf(req, doc);
    if (!to.length) return;
    const title = String(doc.displayTitle ?? '');
    const when = whenText(start, end, 'long');
    const oldWhen = whenText(oldStart, oldEnd, 'long');
    const details = [
      { label: 'Mikor', value: when, ...(timeChanged ? { was: oldWhen } : {}) },
      { label: 'Hol', value: place, ...(placeChanged ? { was: oldPlace } : {}) },
    ];
    await send(req, to, (u) => ({
      subject: cancelled ? `Elmarad: ${title}` : reinstated ? `Mégis lesz: ${title}` : `Változás: ${title}`,
      html: emailLayout({
        preheader: cancelled ? `${title} — ${when}` : `${title}: ${when} · ${place}`,
        heading: cancelled ? 'Elmarad egy alkalom' : reinstated ? 'Mégis lesz az alkalom' : 'Változott egy alkalom',
        paragraphs: [
          hello(u),
          cancelled
            ? `Az alábbi alkalom elmarad: ${title}.`
            : reinstated
              ? `Az elmaradtnak jelzett alkalom mégis megtartásra kerül: ${title}.`
              : `Változott a(z) ${title} alkalom${timeChanged && placeChanged ? ' ideje és helyszíne' : timeChanged ? ' ideje' : ' helyszíne'}.`,
        ],
        details: cancelled
          ? [
              { label: 'Mikor', value: oldWhen },
              { label: 'Hol', value: oldPlace },
            ]
          : details,
        button: { label: 'Fiókom', href: siteUrl('/fiokom') },
      }),
    }));
  } catch (err) {
    req.payload.logger.error({ err, msg: 'session e-mail failed' });
  }
}
