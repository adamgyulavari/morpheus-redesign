import { describe, expect, it } from 'vitest';

import { googleCalendarUrl, icsCalendar, icsFile } from './ics';
import { at } from './time';

const event = {
  uid: 'booking-12@morpheus-szinmuhely.hu',
  start: at('2026-11-20', '10:00'),
  end: at('2026-11-20', '12:00'),
  summary: 'Teremfoglalás: Próbaterem',
  location: 'Morpheus Színműhely, Próbaterem',
};

describe('icsFile', () => {
  it('writes one UTC event with CRLF line endings', () => {
    const ics = icsFile(event, new Date('2026-11-01T08:00:00Z'));
    expect(ics).toContain('METHOD:PUBLISH\r\n');
    expect(ics).toContain('DTSTART:20261120T090000Z\r\n');
    expect(ics).toContain('DTEND:20261120T110000Z\r\n');
    expect(ics).toContain('DTSTAMP:20261101T080000Z\r\n');
    expect(ics).toContain('LOCATION:Morpheus Színműhely\\, Próbaterem\r\n');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });

  it('cancels the same event', () => {
    const ics = icsFile({ ...event, cancelled: true });
    expect(ics).toContain('METHOD:CANCEL\r\n');
    expect(ics).toContain('STATUS:CANCELLED\r\n');
    expect(ics).toContain('SEQUENCE:1\r\n');
    expect(ics).toContain(`UID:${event.uid}\r\n`);
  });

  it('folds long lines', () => {
    const ics = icsFile({ ...event, description: 'Hosszú megjegyzés '.repeat(10) });
    const lines = ics.split('\r\n');
    expect(lines.some((l) => l.startsWith(' '))).toBe(true);
    expect(lines.every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
});

describe('icsCalendar', () => {
  it('names the calendar and lists every event, a cancelled one marked', () => {
    const ics = icsCalendar('Morpheus Színműhely', [event, { ...event, uid: 'session-3@x', cancelled: true }]);
    expect(ics).toContain('X-WR-CALNAME:Morpheus Színműhely\r\n');
    expect(ics).toContain('METHOD:PUBLISH\r\n');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('STATUS:CANCELLED\r\n');
    expect(ics).not.toContain('SEQUENCE:1');
  });
});

describe('googleCalendarUrl', () => {
  it('fills in the event, in UTC', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe(event.summary);
    expect(url.searchParams.get('dates')).toBe('20261120T090000Z/20261120T110000Z');
    expect(url.searchParams.get('location')).toBe(event.location);
  });
});
