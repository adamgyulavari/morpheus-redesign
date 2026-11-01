/**
 * iCalendar (RFC 5545): a one-event file for e-mails and the "Naptárba" buttons — adding a booking
 * to the student's calendar, or (same UID, higher SEQUENCE, METHOD:CANCEL) removing it again — and
 * the calendar feed a student subscribes to (/naptar/<token>).
 */
export type IcsEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  location?: string;
  description?: string;
  cancelled?: boolean;
};

const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
const text = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds lines longer than 75 octets (continuation lines start with a space). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  for (const ch of line) {
    if (new TextEncoder().encode(current + ch).length > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = '';
    }
    current += ch;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const vevent = (e: IcsEvent, now: Date, sequence: number) => [
  'BEGIN:VEVENT',
  `UID:${e.uid}`,
  `SEQUENCE:${sequence}`,
  `DTSTAMP:${stamp(now)}`,
  `DTSTART:${stamp(e.start)}`,
  `DTEND:${stamp(e.end)}`,
  `SUMMARY:${text(e.summary)}`,
  ...(e.location ? [`LOCATION:${text(e.location)}`] : []),
  ...(e.description ? [`DESCRIPTION:${text(e.description)}`] : []),
  `STATUS:${e.cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
  'END:VEVENT',
];

const calendar = (head: string[], events: string[][]) =>
  `${['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Morpheus Szinmuhely//Teremfoglalas//HU', 'CALSCALE:GREGORIAN', ...head, ...events.flat(), 'END:VCALENDAR'].map(fold).join('\r\n')}\r\n`;

export function icsFile(e: IcsEvent, now = new Date()): string {
  return calendar([`METHOD:${e.cancelled ? 'CANCEL' : 'PUBLISH'}`], [vevent(e, now, e.cancelled ? 1 : 0)]);
}

/** A subscribed calendar: every event as it is now (a cancelled one stays, marked so); refetched every few hours. */
export function icsCalendar(name: string, events: IcsEvent[], now = new Date()): string {
  return calendar(
    [
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${text(name)}`,
      'X-WR-TIMEZONE:Europe/Budapest',
      'REFRESH-INTERVAL;VALUE=DURATION:PT3H',
      'X-PUBLISHED-TTL:PT3H',
    ],
    events.map((e) => vevent(e, now, 0)),
  );
}

/** The same event as a Google Calendar "add event" link (opens Google with the event filled in). */
export function googleCalendarUrl(e: IcsEvent): string {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.summary,
    dates: `${stamp(e.start)}/${stamp(e.end)}`,
    ...(e.description ? { details: e.description } : {}),
    ...(e.location ? { location: e.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
