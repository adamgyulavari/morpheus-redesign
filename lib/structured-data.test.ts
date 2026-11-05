import { describe, expect, it } from 'vitest';

import { postalAddress } from './structured-data';

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
