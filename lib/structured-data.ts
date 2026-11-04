/**
 * Structured data (schema.org JSON-LD) for search engines: the theatre on the home page, and every
 * listed show as an event (Google's event results: date, place, tickets). Rendered by components/JsonLd.
 */
import { serverUrl } from './env';
import { showCheckoutPath } from './payments/links';
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

/** Where the visitor gets in: our own booking (price, sold out), the ticketing site or a free registration. */
function offers(show: ShowWithRelations): Thing | undefined {
  const b = show.booking;
  if (b && b.state !== 'closed') {
    return {
      '@type': 'Offer',
      url: absolute(showCheckoutPath(b.code)),
      price: b.price,
      priceCurrency: 'HUF',
      availability: `https://schema.org/${b.state === 'full' ? 'SoldOut' : 'InStock'}`,
    };
  }
  if (show.ticketUrl) return { '@type': 'Offer', url: show.ticketUrl };
  if (show.registrationUrl) return { '@type': 'Offer', url: show.registrationUrl, price: 0, priceCurrency: 'HUF' };
  return undefined;
}

/** The shows as theatre events, each at its own address: its production page, else its row in the list. */
export const showEvents = (shows: ShowWithRelations[], s: SiteSettings): Thing[] =>
  shows.map((show) => {
    const p = show.production;
    return {
      '@context': 'https://schema.org',
      '@type': 'TheaterEvent',
      name: show.label ? `${p.title} (${show.label})` : p.title,
      description: p.summary,
      startDate: at(show.date, show.time).toISOString(),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      url: absolute(p.detailPage ? `/repertoar/${p.slug}` : `${s.urls.upcomingShows}#eloadas-${show.id}`),
      image: absolute(p.poster.src),
      location: { '@type': 'Place', name: show.venue.shortName, address: show.venue.name },
      performer: group(s),
      organizer: group(s),
      offers: offers(show),
    };
  });
