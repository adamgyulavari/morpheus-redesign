/**
 * E-mails of the room calendar, sent from the save hook (payload/collections/RoomBookings.ts), in
 * the shared layout (payload/email.ts):
 * practice booking confirmed (with an .ics), changed by staff, cancelled (by the student, or by
 * staff / an admin override — with the reason; the .ics removes it from the calendar). Changes to
 * sessions (lessons, rehearsals, shows) are told to the students by hand, not e-mailed.
 * Their texts are in the admin (Beállítások → E-mailek). A failed e-mail never fails the save; it is logged.
 */
import type { PayloadRequest } from 'payload';
import { fromTemplate, siteUrl } from '@/payload/email';
import { emailTexts } from '@/payload/email-texts';
import { relId, relIds } from '@/payload/rel';

import { whenText } from './format';
import { icsFile } from './ics';
import { BOOKING_KINDS } from './labels';
import { roomNames } from './occupancy';

const STUDIO = 'Morpheus Színműhely';

type Doc = Record<string, unknown>;
type Recipient = { id: number; email: string; firstName?: string | null };

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
    const texts = await emailTexts(req.payload);
    const c = texts.common;
    const when = whenText(start, end, 'long');
    const details = [
      { label: c.labelWhen, value: when },
      { label: c.labelWhere, value: rooms },
      ...(owner ? [{ label: c.labelFor, value: String(owner) }] : []),
      ...(doc.note ? [{ label: c.labelNote, value: String(doc.note) }] : []),
    ];
    const href = siteUrl('/fiokom/terem');
    const vars = (u: Recipient) => ({ keresztnev: u.firstName, mikor: when, hol: rooms });

    const wasConfirmed = previous?.status === 'confirmed';
    if (operation === 'create' && doc.status === 'confirmed') {
      return await send(req, [user], (u) => ({
        ...fromTemplate(texts, 'bookingConfirmed', vars(u), { greet: u, details, href }),
        ics: ics(),
      }));
    }
    if (wasConfirmed && doc.status === 'cancelled') {
      const byStaff = relId(doc.cancelledBy) !== userId;
      const reason = byStaff && doc.cancelReason ? String(doc.cancelReason) : undefined;
      return await send(req, [user], (u) => ({
        ...fromTemplate(
          texts,
          byStaff ? 'bookingCancelledByStaff' : 'bookingCancelledBySelf',
          { ...vars(u), ok: reason },
          {
            greet: u,
            details: [...details, ...(reason ? [{ label: c.labelReason, value: reason }] : [])],
            href,
          },
        ),
        ics: ics(true),
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
        ...fromTemplate(texts, 'bookingMoved', vars(u), {
          greet: u,
          details: [
            { label: c.labelWhen, value: when, ...(oldWhen !== when ? { was: oldWhen } : {}) },
            { label: c.labelWhere, value: rooms, ...(oldRooms !== rooms ? { was: oldRooms } : {}) },
          ],
          href,
        }),
        ics: ics(),
      }));
    }
  } catch (err) {
    req.payload.logger.error({ err, msg: 'practice e-mail failed' });
  }
}
