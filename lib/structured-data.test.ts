import { describe, expect, it } from 'vitest';

import { faqPage, postalAddress } from './structured-data';

describe('postalAddress', () => {
  it('splits a Hungarian address into its parts', () => {
    expect(postalAddress('1027 Budapest, Frankel Leó út 6.')).toEqual({
      '@type': 'PostalAddress',
      streetAddress: 'Frankel Leó út 6.',
      postalCode: '1027',
      addressLocality: 'Budapest',
      addressCountry: 'HU',
    });
  });

  it('keeps any other wording as it is', () => {
    expect(postalAddress('Bethlen Téri Színház')).toBe('Bethlen Téri Színház');
  });
});

describe('faqPage', () => {
  const faq = (question: string, ...answer: string[]) =>
    ({ blockType: 'faq', heading: 'GYIK', items: [{ question, answer: answer.map((text) => [{ text }]) }] }) as never;

  it('merges every FAQ block of the page into one FAQPage, answers as plain text', () => {
    expect(faqPage([faq('Mikor?', 'Hétfőn.', 'Este.'), faq('Hol?', 'Budapesten.')])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Mikor?', acceptedAnswer: { '@type': 'Answer', text: 'Hétfőn.\n\nEste.' } },
        { '@type': 'Question', name: 'Hol?', acceptedAnswer: { '@type': 'Answer', text: 'Budapesten.' } },
      ],
    });
  });

  it('is left out on a page without one', () => {
    expect(faqPage([])).toBeUndefined();
  });
});
