/** Building blocks of the "Közelgő alkalmak" list: the next item's card, a day's date, a two-line entry. */
import Link from 'next/link';

import { CalendarDownloadIcon, CalendarPlusIcon, PinIcon } from '@/components/icons';
import { fill } from '@/lib/format';
import { googleCalendarUrl } from '@/lib/rooms/ics';

import ApplicationActions from './ApplicationActions';
import { calendarEvent } from './calendar';
import type { UpcomingItem } from './items';
import { dateParts, timeRange } from './items';
import { CANCELLED, KIND_STYLE, KindBadge, KindLabel, NoPlace, type UpcomingTexts } from './kinds';

/** `always`: the calendar links without hovering (guests, who have no subscription). */
type Props = { item: UpcomingItem; t: UpcomingTexts; always?: boolean };

/** "Ma" / "Holnap", when it is. */
const relativeDay = (d: ReturnType<typeof dateParts>, t: UpcomingTexts) => (d.relative ? t[d.relative] : undefined);

/** The next item: a card tinted by its kind, with a big time. */
export function NextCard({ item, t, always }: Props) {
  const d = dateParts(item.start);
  const relative = relativeDay(d, t);
  const k = KIND_STYLE[item.kind];
  return (
    <article
      className="group flex flex-col gap-5 rounded-3xl border p-6 lg:p-8"
      style={{ background: `color-mix(in srgb, ${k.tint} 55%, var(--color-paper))`, borderColor: k.tint }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <KindLabel kind={item.kind} t={t} />
        <span className="text-[14px] font-semibold text-ink2">
          {relative ? `${relative}, ${d.weekday}` : `${d.month} ${d.dayNumber}., ${d.weekday}`}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-display text-[44px] leading-none text-ink tabular-nums lg:text-[56px]">{timeRange(item)}</p>
        <p className="text-[18px] font-semibold text-ink">{item.title}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-ink2">
        <span className="inline-flex items-center gap-2">
          <PinIcon colour={k.ink} className="h-[18px] w-[18px] shrink-0" />
          {item.place ?? <NoPlace t={t} />}
        </span>
        {item.booker && <span className="text-muted">{fill(t.bookedBy, { name: item.booker })}</span>}
        {item.note && <span className="italic text-muted">„{item.note}”</span>}
        {item.handle && <CalendarLinks item={item} t={t} always={always} />}
        {(item.application || item.practice) && (
          <span className="ml-auto">
            <Actions item={item} t={t} />
          </span>
        )}
      </div>
    </article>
  );
}

/** A day as on the show list: the big serif day number, month and weekday stacked beside it. */
export function DateBlock({ iso, t }: { iso: string; t: UpcomingTexts }) {
  const d = dateParts(iso);
  const relative = relativeDay(d, t);
  return (
    <div className="flex items-center gap-1.5">
      {/* fixed width, so the months line up whatever the digits */}
      <span className="w-[36px] shrink-0 font-display text-[40px] leading-none text-rust">{d.dayNumber}</span>
      <span className="text-[13px] font-semibold leading-tight text-ink">
        {d.month}
        <br />
        <span className={relative ? 'text-rust-dark' : 'font-normal text-muted'}>{relative ?? d.weekday}</span>
      </span>
    </div>
  );
}

/** Line 1: time and kind; line 2: what, where, who booked. */
function EntryText({ item, t }: Props) {
  const k = KIND_STYLE[item.kind];
  const kind = t.kinds[item.kind];
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
          {item.cancelled ? fill(t.cancelledKind, { kind }) : kind}
        </span>
      </div>
      <p className={`truncate text-[15px] leading-6 ${item.cancelled ? 'text-muted' : 'text-ink2'}`}>
        {item.title} · {item.place ?? <NoPlace t={t} />}
        {item.booker && <span className="text-muted"> · {item.booker}</span>}
        {item.note && <span className="italic text-muted"> · „{item.note}”</span>}
      </p>
    </div>
  );
}

/** An entry with its kind's icon in a tinted circle, centred on the two lines. */
export function Entry({ item, t, always }: Props) {
  return (
    <div className="group flex min-h-12 items-center gap-3.5">
      <KindBadge kind={item.kind} cancelled={item.cancelled} t={t} />
      <EntryText item={item} t={t} />
      {item.handle && !item.cancelled && <CalendarLinks item={item} t={t} always={always} />}
      {(item.application || item.practice) && <Actions item={item} t={t} />}
    </div>
  );
}

/**
 * "Google Naptár" and ".ics letöltése" for one item: shown while the row (or card) is hovered or
 * focused, for those who want it (the "Naptár" box's subscription is the way for students);
 * always for guests, who have no subscription.
 */
function CalendarLinks({ item, t, always }: Props) {
  const button =
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] font-semibold text-teal transition-colors hover:border-teal';
  const shown = always
    ? 'flex'
    : 'sr-only group-focus-within:not-sr-only group-focus-within:flex group-hover:not-sr-only group-hover:flex';
  return (
    <span className={`${shown} shrink-0 flex-wrap items-center gap-2`}>
      <a href={googleCalendarUrl(calendarEvent(item, t.kinds))} target="_blank" rel="noopener" className={button}>
        <CalendarPlusIcon />
        {t.googleCalendar}
      </a>
      <a href={`/fiokom/naptar/${item.handle}`} download className={button}>
        <CalendarDownloadIcon />
        {t.downloadIcs}
      </a>
    </span>
  );
}

/** "Lemondás" / "Áthelyezés" on the person's own Nyitott Műhely date or practice booking. */
function Actions({ item, t }: Props) {
  const d = dateParts(item.start);
  const title = `${item.title} — ${d.month} ${d.dayNumber}., ${d.weekday} ${timeRange(item)}`;
  if (item.practice)
    return (
      <ApplicationActions
        practice
        applicationId={item.practice.bookingId}
        title={fill(t.practice, { title: `${title}${item.place ? ` · ${item.place}` : ''}` })}
        canCancel={item.practice.canCancel}
        canMove={false}
      />
    );
  const a = item.application;
  if (!a) return null;
  const actions = (
    <ApplicationActions
      applicationId={a.id}
      title={title}
      canCancel={a.canCancel}
      canMove={a.canMove}
      moveTargets={a.moveTargets}
      cancelNote={a.canMove ? t.noRefund : undefined}
    />
  );
  // a show booking: its tickets (QR codes) first
  if (!item.tickets) return actions;
  return (
    <span className="flex shrink-0 items-center gap-4">
      <Link href={item.tickets} className="link text-[14px] font-semibold text-teal">
        {t.tickets}
      </Link>
      {actions}
    </span>
  );
}

/** The first item that still happens gets the card; the rest go to the rows. */
export function splitNext(items: UpcomingItem[]) {
  const next = items.find((i) => !i.cancelled);
  return { next, rest: next ? items.filter((i) => i !== next) : items };
}
