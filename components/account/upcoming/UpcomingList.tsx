/**
 * The overview's "Közelgő alkalmak": the next thing in a card of its own, then the rest by day —
 * the date on the left (as on the show list), each entry in two lines with its kind's colour and icon.
 */
import type { UpcomingItem } from './items';
import { byDay } from './items';
import { DateBlock, Entry, NextCard, splitNext } from './parts';

export default function UpcomingList({ items }: { items: UpcomingItem[] }) {
  const { next, rest } = splitNext(items);
  return (
    <div className="flex flex-col gap-6">
      {next && <NextCard item={next} />}
      {rest.length > 0 && (
        <ol className="flex flex-col border-b border-line">
          {byDay(rest).map(({ day, items }) => (
            <li
              key={day}
              className="grid grid-cols-[minmax(0,1fr)] gap-x-3 gap-y-3 border-t border-line py-4 sm:grid-cols-[108px_minmax(0,1fr)]"
            >
              <div className="flex min-h-12 items-center">
                <DateBlock iso={(items[0] as UpcomingItem).start} />
              </div>
              <ul className="flex flex-col gap-2">
                {items.map((i) => (
                  <li key={i.key}>
                    <Entry item={i} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
