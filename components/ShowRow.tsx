import Image from 'next/image';
import type { ReactNode } from 'react';

import { dayOfMonth, monthShort, weekday } from '@/lib/dates';
import type { ShowWithRelations } from '@/lib/types';

import { ArrowRight } from './icons';

/**
 * One show in a "Közelgő előadások" list (homepage and /kozelgo-eloadasok). The button is "Jegyek"
 * for ticketed shows and "Regisztráció" for free ones; `details` adds e.g. an "Az előadásról" popup.
 */
export default function ShowRow({
  show,
  ticketLabel,
  registrationLabel,
  last,
  details,
}: {
  show: ShowWithRelations;
  ticketLabel: string;
  registrationLabel: string;
  last: boolean;
  details?: ReactNode;
}) {
  const action = show.ticketUrl
    ? { label: ticketLabel, href: show.ticketUrl }
    : show.registrationUrl
      ? { label: registrationLabel, href: show.registrationUrl }
      : undefined;
  const { production, venue } = show;
  return (
    <div
      id={`eloadas-${show.id}`}
      // below 1280px: poster on the left, everything else stacked next to it;
      // from 1280px: one row — date · time · poster · title · venue · button
      className={`scroll-mt-28 grid grid-cols-[104px_minmax(0,1fr)] content-start gap-x-4 gap-y-1.5 border-t border-line py-5 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-x-6 xl:grid-cols-[110px_60px_112px_minmax(0,1fr)_250px_180px] 2xl:grid-cols-[150px_80px_128px_minmax(0,1fr)_280px_190px] xl:items-center xl:gap-x-6 xl:gap-y-1 xl:py-5 2xl:gap-x-8 ${last ? 'border-b' : ''}`}
    >
      <div className="col-start-2 row-start-1 flex items-center gap-2.5 xl:col-start-auto xl:row-start-auto xl:gap-3">
        <span className="font-display text-[40px] leading-none text-rust xl:text-[64px]">{dayOfMonth(show.date)}</span>
        <span className="text-[13px] font-semibold leading-tight xl:text-[15px]">
          {monthShort(show.date)}
          <br />
          {weekday(show.date)}
        </span>
        <span className="ml-auto text-lg font-semibold sm:ml-4 xl:hidden">{show.time}</span>
      </div>
      <span className="hidden text-xl font-semibold xl:block">{show.time}</span>
      <Image
        src={production.poster.src}
        alt={production.poster.alt}
        width={production.poster.width}
        height={production.poster.height}
        sizes="(min-width: 1280px) 128px, 132px"
        className="col-start-1 row-span-6 row-start-1 h-auto w-full self-start rounded-lg bg-deep shadow-[0_10px_20px_-12px_rgba(11,58,63,0.6)] xl:col-start-auto xl:row-span-1 xl:row-start-auto xl:self-center xl:rounded-[10px]"
      />
      <div className="col-start-2 flex flex-col gap-1 xl:col-start-auto">
        <span className="font-display text-[26px] leading-tight xl:text-[38px]">{production.title}</span>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted xl:text-base">
          {show.label && <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-deep">{show.label}</span>}
          <span>{production.byline}</span>
        </span>
        {details}
      </div>
      <span className="col-start-2 text-sm text-ink2 xl:col-start-auto xl:text-base">{venue.name}</span>
      {action ? (
        <a
          href={action.href}
          aria-label={`${action.label} – ${production.title}`}
          className="btn btn-md btn-outline col-start-2 mt-2 justify-self-start xl:col-start-auto xl:mt-0 xl:justify-self-end"
        >
          {action.label}
          <ArrowRight />
        </a>
      ) : (
        <span className="hidden xl:block" />
      )}
    </div>
  );
}
