/** Building blocks of the "Közelgő alkalmak" list: the next item's card, a day's date, a two-line entry. */
import { PinIcon } from '@/components/icons';

import ApplicationActions from './ApplicationActions';
import type { UpcomingItem } from './items';
import { dateParts, timeRange } from './items';
import { CANCELLED, KIND_STYLE, KindBadge, KindLabel, NoPlace } from './kinds';

/** The next item: a card tinted by its kind, with a big time. */
export function NextCard({ item }: { item: UpcomingItem }) {
  const d = dateParts(item.start);
  const k = KIND_STYLE[item.kind];
  return (
    <article
      className="flex flex-col gap-5 rounded-3xl border p-6 lg:p-8"
      style={{ background: `color-mix(in srgb, ${k.tint} 55%, var(--color-paper))`, borderColor: k.tint }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <KindLabel kind={item.kind} />
        <span className="text-[14px] font-semibold text-ink2">
          {d.relative ? `${d.relative}, ${d.weekday}` : `${d.month} ${d.dayNumber}., ${d.weekday}`}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-display text-[44px] leading-none text-ink tabular-nums lg:text-[56px]">{timeRange(item)}</p>
        <p className="text-[18px] font-semibold text-ink">{item.title}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-ink2">
        <span className="inline-flex items-center gap-2">
          <PinIcon colour={k.ink} className="h-[18px] w-[18px] shrink-0" />
          {item.place ?? <NoPlace />}
        </span>
        {item.booker && <span className="text-muted">Foglalta: {item.booker}</span>}
        {item.note && <span className="italic text-muted">„{item.note}”</span>}
        {(item.application || item.practice) && (
          <span className="ml-auto">
            <Actions item={item} />
          </span>
        )}
      </div>
    </article>
  );
}

/** A day as on the show list: the big serif day number, month and weekday stacked beside it. */
export function DateBlock({ iso }: { iso: string }) {
  const d = dateParts(iso);
  return (
    <div className="flex items-center gap-1.5">
      {/* fixed width, so the months line up whatever the digits */}
      <span className="w-[36px] shrink-0 font-display text-[40px] leading-none text-rust">{d.dayNumber}</span>
      <span className="text-[13px] font-semibold leading-tight text-ink">
        {d.month}
        <br />
        <span className={d.relative ? 'text-rust-dark' : 'font-normal text-muted'}>{d.relative ?? d.weekday}</span>
      </span>
    </div>
  );
}

/** Line 1: time and kind; line 2: what, where, who booked. */
function EntryText({ item }: { item: UpcomingItem }) {
  const k = KIND_STYLE[item.kind];
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2.5 leading-6">
        <span className={`font-semibold tabular-nums ${item.cancelled ? 'text-muted line-through' : 'text-ink'}`}>
          {timeRange(item)}
        </span>
        <span
          className="text-xs font-bold uppercase leading-none tracking-[0.12em]"
          style={{ color: item.cancelled ? CANCELLED.ink : k.ink }}
        >
          {item.cancelled ? `${k.label} · elmarad` : k.label}
        </span>
      </div>
      <p className={`truncate text-[15px] leading-6 ${item.cancelled ? 'text-muted' : 'text-ink2'}`}>
        {item.title} · {item.place ?? <NoPlace />}
        {item.booker && <span className="text-muted"> · {item.booker}</span>}
        {item.note && <span className="italic text-muted"> · „{item.note}”</span>}
      </p>
    </div>
  );
}

/** An entry with its kind's icon in a tinted circle, centred on the two lines. */
export function Entry({ item }: { item: UpcomingItem }) {
  return (
    <div className="flex min-h-12 items-center gap-3.5">
      <KindBadge kind={item.kind} cancelled={item.cancelled} />
      <EntryText item={item} />
      {(item.application || item.practice) && <Actions item={item} />}
    </div>
  );
}

/** "Lemondás" / "Áthelyezés" on the person's own Nyitott Műhely date or practice booking. */
function Actions({ item }: { item: UpcomingItem }) {
  const d = dateParts(item.start);
  const title = `${item.title} — ${d.month} ${d.dayNumber}., ${d.weekday} ${timeRange(item)}`;
  if (item.practice)
    return (
      <ApplicationActions
        practice
        applicationId={item.practice.bookingId}
        title={`Gyakorlás: ${title}${item.place ? ` · ${item.place}` : ''}`}
        canCancel={item.practice.canCancel}
        canMove={false}
      />
    );
  const a = item.application;
  if (!a) return null;
  return (
    <ApplicationActions
      applicationId={a.id}
      title={title}
      canCancel={a.canCancel}
      canMove={a.canMove}
      moveTargets={a.moveTargets}
    />
  );
}

/** The first item that still happens gets the card; the rest go to the rows. */
export function splitNext(items: UpcomingItem[]) {
  const next = items.find((i) => !i.cancelled);
  return { next, rest: next ? items.filter((i) => i !== next) : items };
}
