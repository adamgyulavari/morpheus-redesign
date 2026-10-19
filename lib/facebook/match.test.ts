import { describe, expect, it } from 'vitest';

import { labelOf, localStart, matchProduction, matchVenue } from './match';

const productions = [
  { id: 1, title: 'Az ördög' },
  { id: 5, title: '8:32' },
  { id: 6, title: 'A Premier' },
  { id: 9, title: 'Bernarda Alba háza' },
  { id: 10, title: 'Vízkereszt, vagy amit akartok' },
  { id: 11, title: 'Premier' },
];
const venues = [
  { id: 1, name: '1027 Budapest, Frankel Leó út 6.' },
  { id: 2, name: 'Hankó István Művészeti Központ, Gyömrő' },
];

describe('matching Facebook events', () => {
  it('the production: its title in the name, the longest wins', () => {
    expect(matchProduction('Molnár Ferenc: Az ördög', productions)?.id).toBe(1);
    expect(matchProduction('8:32 - Hallgatói előadás // Bemutató', productions)?.id).toBe(5);
    expect(matchProduction('TELTHÁZ!// A Premier - Hallgatói előadás (Nyilvános főpróba)', productions)?.id).toBe(6);
    expect(
      matchProduction('William Shakespeare: Vízkereszt, vagy amit akartok // Hallgatói előadás', productions)?.id,
    ).toBe(10);
    expect(matchProduction('Federico García Lorca: Bernarda Alba háza (Hallgatói előadás)', productions)?.id).toBe(9);
    expect(matchProduction('Nyílt nap', productions)).toBeUndefined();
  });
  it('the venue: by name, with or without "ÚJ CÍMÜNK:" and the town', () => {
    expect(matchVenue('ÚJ CÍMÜNK: 1027 Budapest, Frankel Leó út 6., Budapest, Hungary', venues)?.id).toBe(1);
    expect(matchVenue('Hankó István Művészeti Központ', venues)?.id).toBe(2);
    expect(matchVenue('Katona József Színház', venues)).toBeUndefined();
    expect(matchVenue(undefined, venues)).toBeUndefined();
  });
  it('the label: only the known words', () => {
    expect(labelOf('8:32 - Hallgatói előadás // Bemutató')).toBe('Bemutató');
    expect(labelOf('TELTHÁZ!// A Premier - Hallgatói előadás (Nyilvános főpróba)')).toBe('Nyilvános főpróba');
    expect(labelOf('Molnár Ferenc: Az ördög')).toBeUndefined();
  });
  it('the start in Budapest time', () => {
    expect(localStart('2026-10-28T19:00:00+0100')).toEqual({ date: '2026-10-28', time: '19:00' });
    expect(localStart('2026-07-10T18:00:00+0200')).toEqual({ date: '2026-07-10', time: '18:00' });
  });
});
