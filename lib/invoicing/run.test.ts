import { describe, expect, it } from 'vitest';

import { addMonths, instalment, isMonth, monthLabel } from './run';

describe('the monthly run', () => {
  it('months', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-01', 0)).toBe('2026-01');
    expect(isMonth('2026-13')).toBe(false);
    expect(isMonth('2026-09')).toBe(true);
    expect(monthLabel('2026-11')).toBe('2026. november');
  });
  it('instalments add up to the total', () => {
    expect([1, 2].map((k) => instalment(160000, 2, k))).toEqual([80000, 80000]);
    expect([1, 2, 3].map((k) => instalment(100000, 3, k))).toEqual([33333, 33333, 33334]);
  });
});
