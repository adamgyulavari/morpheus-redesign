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
      className={`scroll-mt-28 grid grid-cols-[52px_84px_minmax(0,1fr)] gap-x-4 gap-y-1 border-t border-line py-5 lg:grid-cols-[150px_80px_80px_minmax(0,1fr)_280px_190px] lg:items-center lg:gap-x-8 lg:py-8 ${last ? 'border-b' : ''}`}
    >
      <div className="row-span-4 flex flex-col gap-1 lg:row-span-1 lg:flex-row lg:items-center lg:gap-3">
        <span className="font-display text-[40px] leading-none text-rust lg:text-[64px]">{dayOfMonth(show.date)}</span>
        <span className="text-[13px] font-semibold leading-tight lg:text-[15px]">
          {monthShort(show.date)}
          <br />
          {weekday(show.date)}
        </span>
      </div>
      <span className="hidden text-xl font-semibold lg:block">{show.time}</span>
      <Image
        src={production.poster.src}
        alt={production.poster.alt}
        width={production.poster.width}
        height={production.poster.height}
        sizes="(min-width: 1024px) 80px, 84px"
        className="row-span-4 h-full min-h-[118px] w-full self-stretch rounded-lg bg-deep object-cover shadow-[0_10px_20px_-12px_rgba(11,58,63,0.6)] lg:row-span-1 lg:h-28 lg:w-20 lg:rounded-[10px]"
      />
      <div className="col-start-3 flex flex-col gap-1 lg:col-start-auto">
        <span className="font-display text-[26px] leading-tight lg:text-[38px]">{production.title}</span>
        <span className="text-sm text-muted lg:text-base">{production.byline}</span>
        {show.label && (
          <span className="self-start rounded-full bg-sand px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-deep">{show.label}</span>
        )}
        {details}
      </div>
      <span className="col-start-3 text-sm text-ink2 lg:col-start-auto lg:text-base">
        <span className="font-semibold text-ink lg:hidden">{show.time} · </span>
        {venue.name}
      </span>
      {action ? (
        <a
          href={action.href}
          aria-label={`${action.label} – ${production.title}`}
          className="btn btn-md btn-outline col-start-3 mt-2 justify-self-start lg:col-start-auto lg:mt-0 lg:justify-self-end"
        >
          {action.label}
          <ArrowRight />
        </a>
      ) : (
        <span className="hidden lg:block" />
      )}
    </div>
  );
}
