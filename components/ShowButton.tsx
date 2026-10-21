import Link from 'next/link';

import SignupDialog from '@/components/signup/SignupDialog';
import { showDateLine } from '@/lib/dates';
import { fill, formatHuf } from '@/lib/format';
import { showCheckoutPath } from '@/lib/payments/links';
import type { ShowWithRelations, UiStrings } from '@/lib/types';

import { ArrowRight } from './icons';

/**
 * A show's button wherever it is listed. Booked on the site: "Jegyek" to its checkout, or (free)
 * "Regisztráció" opening the booking dialog; "Megtelt" when the seats are gone; nothing once it is
 * closed. Otherwise its external link (Tixa, a registration form), if it has one.
 */
export default function ShowButton({
  show,
  ui,
  className,
}: {
  show: ShowWithRelations;
  ui: Pick<UiStrings, 'shows' | 'sessions' | 'showBooking'>;
  /** The button's look, e.g. "btn btn-md btn-outline". */
  className: string;
}) {
  const b = show.booking;
  const label = (text: string) => `${text} – ${show.production.title}`;
  if (b) {
    if (b.state === 'closed') return null;
    if (b.state === 'full')
      return <span className={`${className} pointer-events-none opacity-60`}>{ui.sessions.full}</span>;
    if (b.price > 0)
      return (
        <Link href={showCheckoutPath(b.code)} aria-label={label(ui.shows.ticket)} className={className}>
          {ui.shows.ticket}
          <ArrowRight />
        </Link>
      );
    return (
      <SignupDialog
        label={ui.shows.registration}
        buttonClassName={className}
        target={{
          kind: 'show',
          title: show.production.title,
          details: [showDateLine(show.date, show.time), show.venue.name],
          price: ui.showBooking.free,
          showCode: b.code,
          maxSeats: Math.min(b.left, b.maxPerBooking),
        }}
      />
    );
  }
  const link = show.ticketUrl
    ? { text: ui.shows.ticket, href: show.ticketUrl }
    : show.registrationUrl
      ? { text: ui.shows.registration, href: show.registrationUrl }
      : null;
  if (!link) return null;
  return (
    <a href={link.href} aria-label={label(link.text)} className={className}>
      {link.text}
      <ArrowRight />
    </a>
  );
}

/** Does the show have a button (the lists keep its grid cell otherwise)? */
export const hasShowButton = (s: ShowWithRelations) =>
  s.booking ? s.booking.state !== 'closed' : Boolean(s.ticketUrl || s.registrationUrl);

/** "3500 Ft / jegy" (the checkout's summary). */
export const ticketText = (price: number, ui: Pick<UiStrings, 'showBooking'>) =>
  fill(ui.showBooking.perTicket, { price: formatHuf(price) });
