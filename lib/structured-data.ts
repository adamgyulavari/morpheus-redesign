/**
 * Structured data (schema.org JSON-LD) for search engines: the theatre on the home page, every listed
 * show as an event (Google's event results: date, place, tickets) and a page's FAQ blocks. Rendered by
 * components/JsonLd.
 */
import { serverUrl } from './env';
import { at } from './rooms/time';
import type { Block, ShowWithRelations, SiteSettings } from './types';

type Thing = Record<string, unknown>;

const absolute = (path: string) => (/^https?:/.test(path) ? path : `${serverUrl()}${path}`);

const group = (settings: SiteSettings): Thing => ({
  '@type': 'PerformingGroup',
  name: settings.name,
  url: absolute('/'),
});

/** "1027 Budapest, Frankel Leó út 6." as its parts; any other wording as it is. */
export function postalAddress(address: string): Thing | string {
  const parts = address.match(/^(\d{4}) ([^,]+), (.+)$/);
  if (!parts) return address;
  const [, postalCode, addressLocality, streetAddress] = parts;
  return { '@type': 'PostalAddress', streetAddress, postalCode, addressLocality, addressCountry: 'HU' };
}

/** The theatre (a company that also teaches): name, address, e-mail and phone, logo, its social profiles. */
export const organization = (settings: SiteSettings, phone?: string): Thing => ({
  '@context': 'https://schema.org',
  ...group(settings),
  '@type': ['PerformingGroup', 'EducationalOrganization'],
  description: settings.tagline,
  logo: absolute('/logo.png'),
  email: settings.contact.email,
  telephone: phone,
  address: postalAddress(settings.contact.address),
  sameAs: [settings.social.facebook, settings.social.instagram].filter(Boolean),
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
  const externalAvailability = show.soldOut ? { availability: 'https://schema.org/SoldOut' } : {};
  if (show.ticketUrl) return { '@type': 'Offer', url: show.ticketUrl, ...externalAvailability };
  if (show.registrationUrl)
    return { '@type': 'Offer', url: show.registrationUrl, price: 0, priceCurrency: 'HUF', ...externalAvailability };
  return undefined;
}

/** The shows as theatre events, each at its own address: its production page, else its row in the list. */
export const showEvents = (shows: ShowWithRelations[], settings: SiteSettings): Thing[] =>
  shows.map((show) => {
    const production = show.production;
    const page = absolute(
      production.detailPage ? `/repertoar/${production.slug}` : `${settings.urls.upcomingShows}#eloadas-${show.id}`,
    );
    return {
      '@context': 'https://schema.org',
      '@type': 'TheaterEvent',
      name: show.label ? `${production.title} (${show.label})` : production.title,
      description: production.summary,
      startDate: at(show.date, show.time).toISOString(),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      url: page,
      image: absolute(production.poster.src),
      location: { '@type': 'Place', name: show.venue.shortName, address: postalAddress(show.venue.name) },
      performer: group(settings),
      organizer: group(settings),
      offers: offers(show, page),
    };
  });

type FaqItem = Extract<Block, { blockType: 'faq' }>['items'][number];

/** Every FAQ block of a page as one FAQPage (Google takes one per page); the answers as plain text. */
export function faqPage(blocks: Block[]): Thing | undefined {
  const items: FaqItem[] = blocks.flatMap((block) => (block.blockType === 'faq' ? block.items : []));
  if (!items.length) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.map((paragraph) => paragraph.map((segment) => segment.text).join('')).join('\n\n'),
      },
    })),
  };
}
