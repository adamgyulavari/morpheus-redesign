/**
 * A show booking's tickets: one per seat, each a QR code leading to /jegy/<code>. There staff
 * (logged in) use it with one button at the door — once; anyone else sees the ticket. The codes
 * are made by the Applications collection when a booking holds (free: at once; paid: when paid).
 */
import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';
import QRCode from 'qrcode';

import { dbOf } from '@/payload/db';
import { siteUrl } from '@/payload/email';
import { relId } from '@/payload/rel';
import type { Application } from '@/payload-types';

import { showInfo, showStart } from './shows';

export const ticketPath = (code: string) => `/jegy/${encodeURIComponent(code)}`;

const QR = { margin: 1, color: { dark: '#10292c', light: '#ffffff' } };

/** The booking's tickets as images for an e-mail (inline attachments: cid). */
export async function ticketImages(a: Pick<Application, 'id' | 'tickets'>) {
  return Promise.all(
    (a.tickets ?? []).map(async (t, i) => ({
      cid: `jegy-${a.id}-${i + 1}@morpheus`,
      n: i + 1,
      href: siteUrl(ticketPath(t.code)),
      png: await QRCode.toBuffer(siteUrl(ticketPath(t.code)), { ...QR, width: 360 }),
    })),
  );
}

/** A ticket's QR code for a page (SVG markup). */
export const ticketSvg = (code: string) => QRCode.toString(siteUrl(ticketPath(code)), { ...QR, type: 'svg' });

export type TicketView = {
  code: string;
  /** Which of the booking's tickets, of how many. */
  n: number;
  of: number;
  name: string;
  title: string;
  when: string;
  place?: string;
  /** valid: may be used; used: already (when); invalid: the booking was cancelled, or the show is over. */
  state: 'valid' | 'used' | 'invalid';
  usedAt?: string;
};

/** The ticket of this code, as the /jegy page shows it (null: no such ticket). */
export async function ticketByCode(payload: Payload, code: string, now = new Date()): Promise<TicketView | null> {
  if (!code || code.length > 40) return null;
  const { docs } = await payload.find({
    collection: 'applications',
    where: { and: [{ kind: { equals: 'show' } }, { 'tickets.code': { equals: code } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const a = docs[0];
  const i = a?.tickets?.findIndex((t) => t.code === code) ?? -1;
  const ticket = a?.tickets?.[i];
  if (!a || !ticket) return null;
  const s = await payload.findByID({ collection: 'shows', id: relId(a.show) ?? 0, depth: 1, disableErrors: true });
  if (!s) return null;
  const info = showInfo(s);
  // the show's evening: valid until the next morning
  const over = now.getTime() > showStart(s).getTime() + 12 * 3_600_000;
  return {
    code,
    n: i + 1,
    of: a.tickets?.length ?? 1,
    name: a.name,
    title: info.title,
    when: info.when ?? '',
    place: info.place,
    state: ticket.usedAt ? 'used' : a.status === 'registered' && !over ? 'valid' : 'invalid',
    usedAt: ticket.usedAt ?? undefined,
  };
}

/**
 * At the door: the ticket is used — once (the update only touches an unused ticket of a booking
 * that holds, so two phones can't both let it in).
 */
export async function redeemTicket(
  payload: Payload,
  code: string,
  staffId: number,
): Promise<'used' | 'already' | 'invalid'> {
  const db = await dbOf(payload);
  const { rows } = await db.execute(sql`
    UPDATE applications_tickets t SET used_at = now(), used_by_id = ${staffId}
    FROM applications a
    WHERE t._parent_id = a.id AND t.code = ${code} AND t.used_at IS NULL
      AND a.kind = 'show' AND a.status = 'registered'
    RETURNING t.id`);
  if (rows.length) return 'used';
  const { rows: seen } = await db.execute(
    sql`SELECT used_at FROM applications_tickets WHERE code = ${code} AND used_at IS NOT NULL`,
  );
  return seen.length ? 'already' : 'invalid';
}
