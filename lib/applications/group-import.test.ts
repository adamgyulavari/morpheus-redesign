import { describe, expect, it } from 'vitest';

import { addHours, datesOf, planGroups, splitName, typeOf, weekdayOf } from './group-import';

describe('group import', () => {
  it('reads the type from the name', () => {
    expect(typeOf('Scherer Péter kezdő')).toBe('kezdo');
    expect(typeOf('Hétfői szakmai II.')).toBe('szakmai');
    expect(typeOf('Morpheus Társulat')).toBe('tarsulat');
    expect(typeOf('Nyári tábor')).toBe('egyeb');
  });

  it('makes the weekly slot: kezdő 2 hours, szakmai 3', () => {
    const [kezdo, szakmai] = planGroups(
      {
        groups: [
          { name: 'Rejtő Jenő kezdő kurzus', weekday: 'Sunday', startTime: '10:00', members: [] },
          { name: 'Keddi szakmai II.', weekday: 'Tuesday', startTime: '18:00', members: [] },
        ],
      },
      '2026-10-20',
    );
    expect(kezdo?.schedule).toEqual({ weekday: '7', startTime: '10:00', endTime: '12:00' });
    expect(szakmai?.schedule).toEqual({ weekday: '2', startTime: '18:00', endTime: '21:00' });
    expect(addHours('22:30', 3)).toBe('23:59');
    expect(weekdayOf('monday')).toBe('1');
    expect(weekdayOf('Hétfő')).toBeNull();
  });

  it('dates: this year; ended (no start time) at the end of last month; a társulat none', () => {
    expect(datesOf('szakmai', true, '2026-10-20')).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(datesOf('kezdo', false, '2026-10-20')).toEqual({ startDate: '2026-01-01', endDate: '2026-09-30' });
    expect(datesOf('tarsulat', true, '2026-10-20')).toEqual({});
    const [ended] = planGroups({ groups: [{ name: 'Régi kezdő', weekday: 'Monday', members: [] }] }, '2026-03-05');
    expect(ended?.endDate).toBe('2026-02-28');
    expect(ended?.schedule).toBeNull();
  });

  it('splits Hungarian names, the family name first', () => {
    expect(splitName('Kiss Anna')).toEqual({ lastName: 'Kiss', firstName: 'Anna' });
    expect(splitName('Kovács Anna Mária')).toEqual({ lastName: 'Kovács', firstName: 'Anna Mária' });
    expect(splitName('Dr. Nagy Péter')).toEqual({ lastName: 'Dr. Nagy', firstName: 'Péter' });
    expect(splitName('Madonna')).toEqual({ lastName: 'Madonna', firstName: '-' });
  });

  it('keeps members by e-mail, lower case', () => {
    const [g] = planGroups(
      {
        groups: [
          {
            name: 'X szakmai',
            weekday: 'Monday',
            startTime: '18:00',
            members: [
              { name: 'Kiss Anna', email: ' Anna@Example.HU ' },
              { name: 'Nincs Cím', email: '' },
            ],
          },
        ],
      },
      '2026-10-20',
    );
    expect(g?.members).toEqual([{ email: 'anna@example.hu', lastName: 'Kiss', firstName: 'Anna' }]);
  });
});
