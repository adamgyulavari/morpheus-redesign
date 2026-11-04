/**
 * Structured data (schema.org JSON-LD) for search engines: the theatre on the home page, and every
 * listed show as an event (Google's event results: date, place, tickets). Rendered by components/JsonLd.
 */
import { serverUrl } from './env';
import { at } from './rooms/time';
import type { ShowWithRelations, SiteSettings } from './types';

type Thing = Record<string, unknown>;

const absolute = (path: string) => (/^https?:/.test(path) ? path : `${serverUrl()}${path}`);

const group = (s: SiteSettings): Thing => ({ '@type': 'PerformingGroup', name: s.name, url: absolute('/') });

/** The theatre: name, address, e-mail, logo and its social profiles. */
export const organization = (s: SiteSettings): Thing => ({
  '@context': 'https://schema.org',
  ...group(s),
  description: s.tagline,
  logo: absolute('/logo.svg'),
  email: s.contact.email,
  address: s.contact.address,
  sameAs: [s.social.facebook, s.social.instagram].filter(Boolean),
});

/**
 * Where the visitor gets in: booked on the site, the show's own page (its button: the checkout, or the
 * free registration dialog) with the price and whether it is sold out; else the ticketing site or a
 * registration form.
 */
function offers(show: ShowWithRelations, page: string): Thing | undefined {
  const booking = show.booking;
  // booked on the site: nothing on offer once its sales are closed
  if (booking) {
    if (booking.state === 'closed') return undefined;
    const availability = booking.state === 'full' ? 'SoldOut' : 'InStock';
    return {
      '@type': 'Offer',
      url: page,
      price: booking.price,
      priceCurrency: 'HUF',
      availability: `https://schema.org/${availability}`,
    };
  }
  // elsewhere: the ticketing site (its price is not known here), or a free registration form
  if (show.ticketUrl) return { '@type': 'Offer', url: show.ticketUrl };
  if (show.registrationUrl) return { '@type': 'Offer', url: show.registrationUrl, price: 0, priceCurrency: 'HUF' };
  return undefined;
}

/** The shows as theatre events, each at its own address: its production page, else its row in the list. */
export const showEvents = (shows: ShowWithRelations[], s: SiteSettings): Thing[] =>
  shows.map((show) => {
    const p = show.production;
    const page = absolute(p.detailPage ? `/repertoar/${p.slug}` : `${s.urls.upcomingShows}#eloadas-${show.id}`);
    return {
      '@context': 'https://schema.org',
      '@type': 'TheaterEvent',
      name: show.label ? `${p.title} (${show.label})` : p.title,
      description: p.summary,
      startDate: at(show.date, show.time).toISOString(),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      url: page,
      image: absolute(p.poster.src),
      location: { '@type': 'Place', name: show.venue.shortName, address: show.venue.name },
      performer: group(s),
      organizer: group(s),
      offers: offers(show, page),
    };
  });
