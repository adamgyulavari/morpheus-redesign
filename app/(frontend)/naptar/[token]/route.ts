/**
 * /naptar/<token>.ics: the calendar feed a student subscribes to (Google, Apple, Outlook) — their
 * sessions, practice, Nyitott Műhely dates and shows, as they are now. The token is the account's
 * secret (made on /fiokom); calendar apps fetch it without a login. Never cached.
 */
import { calendarEvent, calendarItems, userByCalendarToken } from '@/components/account/upcoming/calendar';
import { payloadClient } from '@/lib/auth';
import { getSiteSettings } from '@/lib/data';
import { icsCalendar } from '@/lib/rooms/ics';
import { uiTexts } from '@/payload/ui-texts';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const payload = await payloadClient();
  const user = await userByCalendarToken(payload, (await params).token.replace(/\.ics$/, ''));
  if (!user) return new Response(null, { status: 404 });
  const [items, ui, settings] = await Promise.all([calendarItems(payload, user), uiTexts(payload), getSiteSettings()]);
  const kinds = ui.upcoming.kinds;
  return new Response(
    icsCalendar(
      settings.name,
      items.map((i) => calendarEvent(i, kinds)),
    ),
    {
      headers: {
        'content-type': 'text/calendar; charset=utf-8',
        'content-disposition': 'inline; filename="morpheus.ics"',
        'cache-control': 'private, no-store',
      },
    },
  );
}
