import { describe, expect, it } from 'vitest';

import { placeText } from './format';

const names = new Map([
  [1, 'Nagyterem'],
  [2, 'Próbaterem'],
]);

describe('placeText', () => {
  it('rooms, in the session’s order', () => {
    expect(placeText({ locationType: 'room', rooms: [2, { id: 1 }] }, names)).toBe('Próbaterem, Nagyterem');
  });
  it('the external venue, or just "Külső helyszín" when it isn’t named', () => {
    expect(placeText({ locationType: 'external', externalLocation: 'Trafó' }, names)).toBe('Trafó');
    expect(placeText({ locationType: 'external', externalLocation: ' ' }, names)).toBe('Külső helyszín');
  });
  it('no place yet (or nothing known): undefined, for the caller to word', () => {
    expect(placeText({ locationType: 'unplaced', rooms: [1] }, names)).toBeUndefined();
    expect(placeText({ locationType: 'room', rooms: [9] }, names)).toBeUndefined();
  });
});
