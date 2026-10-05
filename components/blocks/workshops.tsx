import Image from 'next/image';

import SessionStatus from '@/components/SessionStatus';
import SmartLink from '@/components/SmartLink';
import { SectionHeading, SectionIntro } from '@/components/ui';
import WorkshopFeature from '@/components/WorkshopFeature';
import { getOpenWorkshopSessions, getPastWorkshops, getSiteSettings, getUi, getUpcomingWorkshops } from '@/lib/data';
import { dateRange, dayOfMonth, isOnOrBeforeInBudapest, monthDayShort, monthShort, weekday } from '@/lib/dates';
import { fill, formatHuf } from '@/lib/format';

import type { BlockProps } from './types';

/** Upcoming workshops/camps as highlighted bands; renders nothing when there are none. */
export async function UpcomingWorkshops({ block, className }: BlockProps<'upcomingWorkshops'>) {
  const [ui, upcoming] = await Promise.all([getUi(), getUpcomingWorkshops()]);
  if (upcoming.length === 0) return null;
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-5 px-3 lg:gap-8 lg:px-20 ${className}`}>
      {upcoming.map((w) => (
        <WorkshopFeature key={w.id} workshop={w} ui={ui} />
      ))}
    </section>
  );
}

/**
 * Finished workshops/camps. When nothing is upcoming either, an empty state with the Facebook link.
 * The anchor (#workshopok) is only applied while no upcoming workshop block has taken it.
 */
export async function PastWorkshops({ block, className }: BlockProps<'pastWorkshops'>) {
  const [ui, settings, upcoming, past] = await Promise.all([getUi(), getSiteSettings(), getUpcomingWorkshops(), getPastWorkshops(block.limit)]);
  const id = upcoming.length === 0 ? block.anchor : undefined;
  if (past.length === 0) {
    if (upcoming.length > 0) return null;
    return (
      <section id={id} className={`mx-auto max-w-[1440px] px-5 lg:px-20 ${className}`}>
        <div className="flex flex-col gap-4 border-y border-line py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-[28px] leading-tight lg:text-[36px]">{ui.workshops.empty}</p>
          <SmartLink href={settings.social.facebook} className="link link-arrow self-start text-teal sm:self-auto">
            {ui.workshops.followUs}
          </SmartLink>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {past.map((w) => (
          <figure key={w.id} className="flex flex-col gap-3">
            <Image
              src={w.image.src}
              alt={w.image.alt}
              width={w.image.width}
              height={w.image.height}
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="aspect-[5/4] w-full rounded-3xl bg-deep object-cover"
            />
            <figcaption className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">
                {w.kind} · {dateRange(w.startDate, w.endDate)}
              </span>
              <span className="font-display text-[26px] leading-tight lg:text-[30px]">
                {w.title}
                {w.subtitle && ` – ${w.subtitle}`}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** The next Nyitott Műhely sessions with their booking status (re-checked in the browser). */
export async function OpenWorkshopSessions({ block, className }: BlockProps<'openWorkshopSessions'>) {
  const [ui, sessions] = await Promise.all([getUi(), getOpenWorkshopSessions(block.limit)]);
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} aside={<SectionIntro>{block.intro}</SectionIntro>} />
      <div className="flex flex-col border-b border-line">
        {sessions.length === 0 && <p className="border-t border-line py-5 text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{ui.sessions.empty}</p>}
        {sessions.map((session) => (
          <div
            key={session.id}
            className="grid grid-cols-[64px_1fr] items-center gap-x-5 gap-y-3 border-t border-line py-5 sm:grid-cols-[88px_1fr_auto] lg:grid-cols-[150px_1fr_1fr_auto] lg:gap-8 lg:py-6"
          >
            <div className="row-span-2 flex flex-col gap-1 sm:row-span-1 lg:flex-row lg:items-center lg:gap-3">
              <span className="font-display text-[44px] leading-none text-rust lg:text-[64px]">{dayOfMonth(session.date)}</span>
              <span className="text-[13px] font-semibold leading-tight lg:text-[15px]">
                {monthShort(session.date)}
                <br />
                {weekday(session.date)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-[26px] leading-tight lg:text-[32px]">{block.title}</span>
              <span className="text-sm text-muted lg:text-base">
                {session.startTime}–{session.endTime} · {formatHuf(session.price)}
              </span>
            </div>
            <SessionStatus
              bookingDeadline={session.bookingDeadline}
              initiallyOpen={isOnOrBeforeInBudapest(session.bookingDeadline)}
              openText={fill(ui.sessions.open, { deadline: monthDayShort(session.bookingDeadline) })}
              closedText={ui.sessions.closedText}
              bookLabel={ui.sessions.book}
              closedLabel={ui.sessions.closed}
              bookingUrl={session.bookingUrl}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
