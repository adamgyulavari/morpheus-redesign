/**
 * Booking a free show (price 0) on the site: the seats are taken at once (no payment), under the
 * capacity lock of the Applications collection. Paid tickets go through the checkout
 * (lib/payments/checkout.ts checkoutShow). Cancelling: cancelOwn (free bookings only). The admin's
 * ticket list of a show: showTicketList.
 */
import type { Payload } from 'payload';

import { say } from '@/lib/messages';
import { billingSettings } from '@/lib/payments/settings';
import { errorMessage } from '@/lib/rooms/server';
import { relId } from '@/payload/rel';
import { uiTexts } from '@/payload/ui-texts';
import type { Application, User } from '@/payload-types';

import { APPLICATION_KINDS } from './labels';
import { sendShowRegistered, sendStaffNew } from './notify';
import { canBookShow, takesPlace } from './rules';
import { type ApplicantInput, applicantFor, type Result, validateInput } from './server';
import { applicationSettings } from './settings';
import { seatsTaken, showFacts, showInfo, showStart, ticketPrice } from './shows';
import { ticketImages, ticketPath } from './tickets';

export type ShowBookingInput = ApplicantInput & { showId: number; seats: number };

export async function bookFreeShow(
  payload: Payload,
  viewer: User | null,
  input: ShowBookingInput,
  now = new Date(),
): Promise<Result<{ applicationId: number }>> {
  const ui = await uiTexts(payload);
  const invalid = validateInput({ ...input, kind: 'show' }, viewer, ui.signupErrors);
  if (invalid) return { ok: false, reason: invalid };
  const s = await payload.findByID({ collection: 'shows', id: input.showId, depth: 1, disableErrors: true });
  if (s?.bookingMode !== 'internal') return { ok: false, reason: ui.signupErrors.noShow };
  if (ticketPrice(s) > 0) return { ok: false, reason: ui.signupErrors.payShow };
  const { maxPerBooking } = (await billingSettings(payload)).showDefaults;
  const taken = (await seatsTaken(payload, [s.id])).get(s.id) ?? 0;
  const verdict = canBookShow(showFacts(s, taken), input.seats, maxPerBooking, now);
  if (!verdict.ok) return { ok: false, reason: say(ui.signupRules, verdict) };

  const { applicant, created } = await applicantFor(payload, viewer, input);
  let booking: Application;
  try {
    booking = await payload.create({
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
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }

  const info = showInfo(s, input.seats);
  await sendShowRegistered(
    payload,
    applicant,
    info,
    { created, loggedIn: Boolean(viewer) },
    await ticketImages(booking),
  );
  await sendStaffNew(payload, await applicationSettings(payload), booking.id, APPLICATION_KINDS.show, applicant, info);
  return { ok: true, applicationId: booking.id };
}

/**
 * Tiszteletjegy: staff give someone free tickets (an account is found or made, as on the site). They
 * take seats like any booking, also while sales are paused, and the guest gets them by e-mail.
 */
export async function giveComplimentaryTickets(
  payload: Payload,
  input: ShowBookingInput,
  now = new Date(),
): Promise<Result<{ applicationId: number }>> {
  const invalid = validateInput({ ...input, kind: 'show' }, null, (await uiTexts(payload)).signupErrors);
  if (invalid) return { ok: false, reason: invalid };
  if (!Number.isInteger(input.seats) || input.seats < 1) return { ok: false, reason: 'Legalább egy jegy kell.' };
  const show = await payload.findByID({ collection: 'shows', id: input.showId, depth: 1, disableErrors: true });
  if (show?.bookingMode !== 'internal') return { ok: false, reason: 'Ez az előadás nem a weboldalon foglalható.' };
  if (showStart(show) <= now) return { ok: false, reason: 'Ez az előadás már elkezdődött.' };

  const { applicant, created } = await applicantFor(payload, null, input);
  const { totalDocs: alreadyBooked } = await payload.count({
    collection: 'applications',
    where: {
      and: [
        { user: { equals: applicant.userId } },
        { show: { equals: show.id } },
        { status: { in: ['held', 'registered'] } },
      ],
    },
  });
  if (alreadyBooked)
    return { ok: false, reason: `${applicant.name} már foglalt erre az előadásra: a meglévő foglalását nyisd meg.` };

  let booking: Application;
  try {
    booking = await payload.create({
      collection: 'applications',
      data: {
        kind: 'show',
        user: applicant.userId,
        show: show.id,
        seats: input.seats,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        complimentary: true,
      },
    });
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
  await sendShowRegistered(
    payload,
    applicant,
    showInfo(show, input.seats),
    { created, loggedIn: false },
    await ticketImages(booking),
    'ticketComplimentary',
  );
  return { ok: true, applicationId: booking.id };
}

/** A booking's kind on the ticket list. */
const bookingState = (booking: Application) =>
  booking.status === 'held'
    ? ('waiting' as const)
    : booking.complimentary
      ? ('complimentary' as const)
      : relId(booking.order)
        ? ('paid' as const)
        : ('free' as const);

/**
 * Előadások → Jegyek (/admin/jegyek/<id>): one show booked on the site with its bookings (the door
 * list), each with its tickets; null for a show booked elsewhere.
 */
export async function showTicketList(payload: Payload, showId: number, now = new Date()) {
  const show = await payload.findByID({ collection: 'shows', id: showId, depth: 1, disableErrors: true });
  if (show?.bookingMode !== 'internal') return null;
  const { docs } = await payload.find({
    collection: 'applications',
    where: {
      and: [{ kind: { equals: 'show' } }, { show: { equals: show.id } }, { status: { in: ['held', 'registered'] } }],
    },
    sort: 'createdAt',
    depth: 0,
    limit: 0,
    pagination: false,
  });
  const bookings = docs.filter((booking) =>
    takesPlace(
      booking.status as NonNullable<typeof booking.status>,
      booking.holdUntil ? new Date(booking.holdUntil) : null,
      now,
    ),
  );
  const tickets = bookings.flatMap((booking) => booking.tickets ?? []);
  const info = showInfo(show);
  return {
    id: show.id,
    title: info.title,
    when: info.when ?? '',
    place: info.place ?? '',
    hidden: Boolean(show.hidden),
    started: showStart(show) <= now,
    price: ticketPrice(show),
    seats: show.booking?.seats ?? 0,
    taken: bookings.reduce((sum, booking) => sum + (booking.seats ?? 1), 0),
    arrived: tickets.filter((ticket) => ticket.usedAt).length,
    bookings: bookings.map((booking) => ({
      id: booking.id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone ?? '',
      seats: booking.seats ?? 1,
      orderId: relId(booking.order) ?? null,
      state: bookingState(booking),
      tickets: (booking.tickets ?? []).map((ticket) => ({
        href: ticketPath(ticket.code),
        used: Boolean(ticket.usedAt),
      })),
    })),
  };
}
