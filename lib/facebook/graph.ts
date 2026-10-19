/**
 * The Facebook Graph API — the only file that talks to Facebook: the page's upcoming events.
 * `FACEBOOK_PAGE_ID` (the page's id, not the profile.php one) and `FACEBOOK_PAGE_TOKEN` (a Page
 * access token with pages_read_engagement) only in env.
 */
const API = 'https://graph.facebook.com/v23.0';

/** An event as we use it. */
export type FbEvent = {
  id: string;
  name: string;
  /** e.g. "2026-10-28T19:00:00+0100" */
  startTime: string;
  place?: string;
  ticketUrl?: string;
  cancelled: boolean;
};

type Raw = {
  id: string;
  name: string;
  start_time: string;
  place?: { name?: string };
  ticket_uri?: string;
  is_canceled?: boolean;
};

export const facebookConfigured = () => Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN);

/** The page's upcoming events (all pages of the answer). Throws with Facebook's message. */
export async function upcomingEvents(): Promise<FbEvent[]> {
  const page = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!page || !token) throw new Error('FACEBOOK_PAGE_ID / FACEBOOK_PAGE_TOKEN nincs beállítva.');
  const fields = 'id,name,start_time,place,ticket_uri,is_canceled';
  let url: string | undefined =
    `${API}/${encodeURIComponent(page)}/events?time_filter=upcoming&limit=50&fields=${fields}&access_token=${encodeURIComponent(token)}`;
  const events: FbEvent[] = [];
  for (let i = 0; url && i < 20; i++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: 'no-store' });
    const body = (await res.json()) as { data?: Raw[]; paging?: { next?: string }; error?: { message?: string } };
    if (!res.ok || body.error) throw new Error(`Facebook: ${body.error?.message ?? res.status}`);
    for (const e of body.data ?? [])
      events.push({
        id: e.id,
        name: e.name,
        startTime: e.start_time,
        place: e.place?.name,
        ticketUrl: e.ticket_uri || undefined,
        cancelled: Boolean(e.is_canceled),
      });
    url = body.paging?.next;
  }
  return events;
}

export const eventLink = (id: string) => `https://www.facebook.com/events/${id}`;
