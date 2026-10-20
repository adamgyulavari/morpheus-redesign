/**
 * "Szinkronizálás a Facebookról" (the Előadás-időpontok list): the page's upcoming events become
 * performance dates. Each date keeps its event's id; its date, time, venue, label and ticket link
 * follow the event, the rest (Tudnivalók, registration link) is the site's. A date already entered
 * by hand (same production, same day) is taken over, not doubled. An event cancelled or gone from
 * Facebook hides its date (Elrejtve). An event without a known production or venue is reported,
 * not saved. Only on request — nothing runs in the background.
 */
import type { Payload } from 'payload';

import { todayInBudapest } from '@/lib/dates';
import { relId } from '@/payload/rel';
import type { Show } from '@/payload-types';

import { eventLink, type FbEvent, upcomingEvents } from './graph';
import { labelOf, localStart, matchProduction, matchVenue } from './match';

export type SyncLine = { name: string; when: string; link: string; note?: string; showId?: number };
export type SyncResult = {
  created: SyncLine[];
  updated: SyncLine[];
  unchanged: number;
  hidden: SyncLine[];
  /** Not saved: a person needs to look (no production / venue found). */
  problems: SyncLine[];
  /** A date at our venue took the rooms: what it cancelled (its note). */
  rooms: SyncLine[];
};

const all = { limit: 0, pagination: false } as const;

/** What a date should say, from its event. */
const wanted = (e: FbEvent, production: number, venue: number) => {
  const { date, time } = localStart(e.startTime);
  return { production, venue, date, time, label: labelOf(e.name) ?? null, ticketUrl: e.ticketUrl ?? null };
};

const differs = (s: Show, w: ReturnType<typeof wanted>) =>
  relId(s.production) !== w.production ||
  relId(s.venue) !== w.venue ||
  String(s.date).slice(0, 10) !== w.date ||
  s.time !== w.time ||
  (s.label ?? null) !== w.label ||
  (s.ticketUrl ?? null) !== w.ticketUrl ||
  Boolean(s.hidden);

export async function syncFromFacebook(payload: Payload, events?: FbEvent[]): Promise<SyncResult> {
  const list = events ?? (await upcomingEvents());
  const today = todayInBudapest();
  const [{ docs: productions }, { docs: venues }, { docs: shows }] = await Promise.all([
    payload.find({ collection: 'productions', depth: 0, draft: true, select: { title: true }, ...all }),
    payload.find({ collection: 'venues', depth: 0, select: { name: true }, ...all }),
    payload.find({ collection: 'shows', where: { date: { greater_than_equal: today } }, depth: 0, ...all }),
  ]);
  const result: SyncResult = { created: [], updated: [], unchanged: 0, hidden: [], problems: [], rooms: [] };
  const seen = new Set<string>();

  for (const e of list) {
    const { date, time } = localStart(e.startTime);
    const line: SyncLine = { name: e.name, when: `${date} ${time}`, link: eventLink(e.id) };
    seen.add(e.id);
    const own = shows.find((s) => s.facebookEventId === e.id);
    if (e.cancelled) {
      if (own && !own.hidden) {
        await payload.update({ collection: 'shows', id: own.id, data: { hidden: true } });
        result.hidden.push({ ...line, showId: own.id, note: 'a Facebookon elmarad' });
      }
      continue;
    }
    const production = matchProduction(e.name, productions);
    const venue = matchVenue(e.place, venues);
    if (!production || !venue) {
      result.problems.push({
        ...line,
        note: !production
          ? 'Nem találtam az előadást: a produkció címe legyen benne az esemény nevében.'
          : `Nem találtam a helyszínt („${e.place ?? '—'}”): vedd fel a Helyszínek közé.`,
      });
      continue;
    }
    const w = wanted(e, production.id, venue.id);
    // the event's own date, or one entered by hand for the same production that day
    const target =
      own ??
      shows.find(
        (s) => !s.facebookEventId && relId(s.production) === production.id && String(s.date).slice(0, 10) === date,
      );
    if (!target) {
      const doc = await payload.create({ collection: 'shows', data: { ...w, facebookEventId: e.id, hidden: false } });
      result.created.push({ ...line, showId: doc.id });
      if (doc.roomNote) result.rooms.push({ ...line, showId: doc.id, note: doc.roomNote });
    } else if (!own || differs(target, w)) {
      const doc = await payload.update({
        collection: 'shows',
        id: target.id,
        data: { ...w, facebookEventId: e.id, hidden: false },
      });
      if (doc.roomNote && doc.roomNote !== target.roomNote)
        result.rooms.push({ ...line, showId: target.id, note: doc.roomNote });
      result.updated.push({
        ...line,
        showId: target.id,
        note: own ? undefined : 'a kézzel felvitt időpontot vettük át',
      });
    } else result.unchanged++;
  }

  // gone from Facebook (deleted): its upcoming date is hidden
  for (const s of shows)
    if (s.facebookEventId && !seen.has(s.facebookEventId) && !s.hidden) {
      await payload.update({ collection: 'shows', id: s.id, data: { hidden: true } });
      result.hidden.push({
        name: s.title ?? '',
        when: `${String(s.date).slice(0, 10)} ${s.time}`,
        link: eventLink(s.facebookEventId),
        showId: s.id,
        note: 'már nincs a Facebookon',
      });
    }
  return result;
}
