/**
 * /fiokom/naptar/<handle>: one of the logged-in person's items as a calendar file (the "Naptárba"
 * button) — a session by its opaque ref (s-…), a Nyitott Műhely date or show booking by its public id
 * (a-…). Only their own; never cached.
 */
import { calendarEvent, calendarItems } from '@/components/account/upcoming/calendar';
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { icsFile } from '@/lib/rooms/ics';
import { uiTexts } from '@/payload/ui-texts';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ handle: string }> }) {
  const [user, payload] = await Promise.all([getCurrentUser(), payloadClient()]);
  const ui = await uiTexts(payload);
  if (!user) return new Response(ui.accountErrors.loginAgain, { status: 401 });
  const handle = (await params).handle;
  const item = (await calendarItems(payload, user)).find((i) => i.handle === handle && !i.cancelled);
  if (!item) return new Response(null, { status: 404 });
  return new Response(icsFile(calendarEvent(item, ui.upcoming.kinds)), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'attachment; filename="morpheus.ics"',
      'cache-control': 'private, no-store',
    },
  });
}
