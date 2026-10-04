import type { Metadata } from 'next';

import Image from 'next/image';

import { CheckIcon } from '@/components/icons';
import SessionStatus from '@/components/SessionStatus';
import SmartLink from '@/components/SmartLink';
import { ButtonLink, CtaBand, Eyebrow, Facts, PageHero, SectionHeading, SectionIntro } from '@/components/ui';
import WorkshopFeature from '@/components/WorkshopFeature';
import { getOpenWorkshopSessions, getPageContent, getPastWorkshops, getUpcomingWorkshops } from '@/lib/data';
import { dateRange, dayOfMonth, isOnOrBeforeInBudapest, monthDayShort, monthShort, weekday } from '@/lib/dates';
import { fill, formatHuf } from '@/lib/format';

// Static page, regenerated at most once a day (ISR) so past sessions and finished workshops drop off
// (or move to "Korábbi workshopok") without a redeploy.
// The open/closed booking status is re-checked in the browser (see SessionStatus).
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('nyitott-alkalmak');
  return { title: meta.title, description: meta.description };
}

/**
 * "Nyitott alkalmak": an upcoming workshop/camp (when there is one) is shown first, then the weekly
 * Nyitott Műhely, then past workshops at the bottom. With no upcoming workshop the page goes straight
 * from the hero into Nyitott Műhely.
 */
export default async function OpenSessionsPage() {
  const [{ hero, workshops: wcopy, openWorkshop, forYou, how, sessions: copy, cta }, sessions, upcoming, past] = await Promise.all([
    getPageContent('nyitott-alkalmak'),
    getOpenWorkshopSessions(6),
    getUpcomingWorkshops(),
    getPastWorkshops(6),
  ]);

  return (
    <>
      <PageHero heading={hero.heading} lead={hero.lead} image={hero.image} layout={{ size: 'sm', tilt: -3, position: 'bottom', sun: 'bottom-left' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink link={hero.primaryCta} variant="primary" arrow />
          {upcoming.length > 0 && <ButtonLink link={hero.workshopCta} variant="outline" />}
          <ButtonLink link={hero.secondaryCta} variant="outline" />
        </div>
      </PageHero>

      {/* UPCOMING WORKSHOPS / CAMPS */}
      {upcoming.length > 0 && (
        <section id="workshopok" className="mx-auto flex max-w-[1440px] scroll-mt-28 flex-col gap-5 px-3 pt-16 lg:gap-8 lg:px-20 lg:pt-[120px]">
          {upcoming.map((w) => (
            <WorkshopFeature key={w.id} workshop={w} copy={wcopy} />
          ))}
        </section>
      )}

      {/* NYITOTT MŰHELY */}
      <section className="mx-auto grid max-w-[1440px] gap-8 px-5 pt-16 lg:grid-cols-[5fr_7fr] lg:gap-20 lg:px-20 lg:pt-[120px]">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{openWorkshop.eyebrow}</Eyebrow>
          <h2 className="font-display text-[48px] leading-none lg:text-[96px]">{openWorkshop.heading}</h2>
        </div>
        <div className="flex flex-col gap-6 lg:pt-4">
          <p className="text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[28px]">{openWorkshop.lead}</p>
          <Facts facts={openWorkshop.facts} />
        </div>
      </section>

      {/* FOR YOU */}
      <section className="mx-auto grid max-w-[1440px] gap-8 px-5 pt-16 lg:grid-cols-[5fr_7fr] lg:gap-20 lg:px-20 lg:pt-[120px]">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{forYou.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">{forYou.heading}</h2>
          <p className="font-display text-[28px] italic leading-tight text-rust lg:mt-4 lg:text-[36px]">{forYou.closing}</p>
        </div>
        <ul className="flex flex-col border-b border-line">
          {forYou.items.map((item) => (
            <li key={item} className="flex items-start gap-4 border-t border-line py-4 lg:py-5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-deep">
                <CheckIcon />
              </span>
              <span className="text-[17px] leading-snug lg:text-xl lg:leading-[28px]">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* HOW */}
      <section id="hogyan" className="mx-auto flex max-w-[1440px] scroll-mt-28 flex-col gap-7 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
        <SectionHeading eyebrow={how.eyebrow} heading={how.heading} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {how.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-3xl border border-line bg-paper p-6 lg:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal font-display text-2xl text-cream">{i + 1}</span>
              <h3 className="font-display text-[28px] leading-none lg:text-[32px]">{step.title}</h3>
              <p className="leading-relaxed text-ink2">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* SESSIONS */}
      <section id="idopontok" className="mx-auto flex max-w-[1440px] scroll-mt-28 flex-col gap-7 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
        <SectionHeading eyebrow={copy.eyebrow} heading={copy.heading} aside={<SectionIntro>{copy.intro}</SectionIntro>} />
        <div className="flex flex-col border-b border-line">
          {sessions.length === 0 && <p className="border-t border-line py-5 text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{copy.empty}</p>}
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
                <span className="font-display text-[26px] leading-tight lg:text-[32px]">{copy.title}</span>
                <span className="text-sm text-muted lg:text-base">
                  {session.startTime}–{session.endTime} · {formatHuf(session.price)}
                </span>
              </div>
              <SessionStatus
                bookingDeadline={session.bookingDeadline}
                initiallyOpen={isOnOrBeforeInBudapest(session.bookingDeadline)}
                openText={fill(copy.openText, { deadline: monthDayShort(session.bookingDeadline) })}
                closedText={copy.closedText}
                bookLabel={copy.bookLabel}
                closedLabel={copy.closedLabel}
                bookingUrl={session.bookingUrl}
              />
            </div>
          ))}
        </div>
      </section>

      {/* PAST WORKSHOPS — at the bottom; also the #workshopok target when nothing is upcoming */}
      {upcoming.length === 0 && past.length === 0 && (
        <section id="workshopok" className="mx-auto max-w-[1440px] scroll-mt-28 px-5 pt-16 lg:px-20 lg:pt-[120px]">
          <div className="flex flex-col gap-4 border-y border-line py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-[28px] leading-tight lg:text-[36px]">{wcopy.empty}</p>
            <SmartLink href={wcopy.emptyLink.href} className="link link-arrow self-start text-teal sm:self-auto">
              {wcopy.emptyLink.label}
            </SmartLink>
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section
          id={upcoming.length === 0 ? 'workshopok' : undefined}
          className="mx-auto flex max-w-[1440px] scroll-mt-28 flex-col gap-7 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]"
        >
          <SectionHeading eyebrow={wcopy.pastEyebrow} heading={wcopy.pastHeading} />
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
      )}

      <CtaBand {...cta} />
    </>
  );
}
