/**
 * Booking a free show (price 0) on the site: the seats are taken at once (no payment), under the
 * capacity lock of the Applications collection. Paid tickets go through the checkout
 * (lib/payments/checkout.ts checkoutShow). Cancelling: cancelOwn (free bookings only). The admin's
 * list of them: showDashboard.
 */
import type { Payload, TypedUser } from 'payload';

import { todayInBudapest } from '@/lib/dates';
import { billingSettings } from '@/lib/payments/settings';
import { errorMessage } from '@/lib/rooms/server';
import { relId } from '@/payload/rel';

import { APPLICATION_KINDS } from './labels';
import { sendShowRegistered, sendStaffNew } from './notify';
import { canBookShow, takesPlace } from './rules';
import { type ApplicantInput, applicantFor, type Result, validateInput } from './server';
import { applicationSettings } from './settings';
import { seatsTaken, showFacts, showInfo, showStart, ticketPrice } from './shows';

export type ShowBookingInput = ApplicantInput & { showId: number; seats: number };

export async function bookFreeShow(
  payload: Payload,
  viewer: TypedUser | null,
  input: ShowBookingInput,
  now = new Date(),
): Promise<Result<{ applicationId: number }>> {
  const invalid = validateInput({ ...input, kind: 'show' }, viewer);
  if (invalid) return { ok: false, reason: invalid };
  const s = await payload.findByID({ collection: 'shows', id: input.showId, depth: 1, disableErrors: true });
  if (s?.bookingMode !== 'internal') return { ok: false, reason: 'Nincs ilyen előadás.' };
  if (ticketPrice(s) > 0) return { ok: false, reason: 'Erre az előadásra jegyet a fizetéssel lehet venni.' };
  const { maxPerBooking } = (await billingSettings(payload)).showDefaults;
  const taken = (await seatsTaken(payload, [s.id])).get(s.id) ?? 0;
  const verdict = canBookShow(showFacts(s, taken), input.seats, maxPerBooking, now);
  if (!verdict.ok) return verdict;

  const { applicant, created } = await applicantFor(payload, viewer, input);
  let applicationId: number;
  try {
    const doc = await payload.create({
      collection: 'applications',
      data: {
        kind: 'show',
        user: applicant.userId,
        show: s.id,
        seats: input.seats,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
      },
    });
    applicationId = doc.id;
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }

  const info = showInfo(s, input.seats);
  await sendShowRegistered(payload, applicant, info, { created, loggedIn: Boolean(viewer) });
  await sendStaffNew(
    payload,
    await applicationSettings(payload),
    applicationId,
    APPLICATION_KINDS.show,
    applicant,
    info,
  );
  return { ok: true, applicationId };
}

/** Jelentkezések → Előadások: the upcoming shows booked here, each with its bookings (the door list). */
export async function showDashboard(payload: Payload, now = new Date()) {
  const { docs: shows } = await payload.find({
    collection: 'shows',
    where: { and: [{ bookingMode: { equals: 'internal' } }, { date: { greater_than_equal: todayStart(now) } }] },
    sort: ['date', 'time'],
    depth: 1,
    limit: 0,
    pagination: false,
  });
  const upcoming = shows.filter((s) => showStart(s) > now);
  if (!upcoming.length) return [];
  const { docs: bookings } = await payload.find({
    collection: 'applications',
    where: {
      and: [
        { kind: { equals: 'show' } },
        { show: { in: upcoming.map((s) => s.id) } },
        { status: { in: ['held', 'registered'] } },
      ],
    },
    sort: 'createdAt',
    depth: 0,
    limit: 0,
    pagination: false,
  });
  return upcoming.map((s) => {
    const info = showInfo(s);
    const mine = bookings.filter(
      (b) =>
        relId(b.show) === s.id &&
        Boolean(b.status) &&
        takesPlace(b.status as NonNullable<typeof b.status>, b.holdUntil ? new Date(b.holdUntil) : null, now),
    );
    return {
      id: s.id,
      title: info.title,
      when: info.when ?? '',
      place: info.place ?? '',
      hidden: Boolean(s.hidden),
      price: ticketPrice(s),
      seats: s.booking?.seats ?? 0,
      taken: mine.reduce((n, b) => n + (b.seats ?? 1), 0),
      bookings: mine.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        phone: b.phone ?? '',
        seats: b.seats ?? 1,
        state: b.status === 'held' ? ('waiting' as const) : relId(b.order) ? ('paid' as const) : ('free' as const),
      })),
    };
  });
}

/** Today's start in Budapest, as the stored days are compared (noon of the day). */
const todayStart = (now: Date) => `${todayInBudapest(now)}T00:00:00.000Z`;
