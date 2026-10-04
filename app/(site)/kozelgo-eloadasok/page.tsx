import type { Metadata } from 'next';

import ShowDetails from '@/components/ShowDetails';
import ShowRow from '@/components/ShowRow';
import { ArrowLink, CtaBand, PageHero } from '@/components/ui';
import { getPageContent, getUpcomingShows } from '@/lib/data';
import { monthLong, year } from '@/lib/dates';
import type { ShowWithRelations } from '@/lib/types';

// Static page, regenerated at most once a day (ISR) so past shows drop off without a redeploy.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('kozelgo-eloadasok');
  return { title: meta.title, description: meta.description };
}

export default async function UpcomingShowsPage() {
  const [{ hero, labels, empty, repertoireLink, allTicketsLink, cta }, shows] = await Promise.all([
    getPageContent('kozelgo-eloadasok'),
    getUpcomingShows(),
  ]);

  // group by month: "2026. október"
  const months = new Map<string, ShowWithRelations[]>();
  for (const show of shows) {
    const key = `${year(show.date)}. ${monthLong(show.date)}`;
    months.set(key, [...(months.get(key) ?? []), show]);
  }

  return (
    <>
      <PageHero heading={hero.heading} lead={hero.lead} image={hero.image} layout={{ size: 'lg', tilt: 1.5, position: 'top', sun: 'top-right' }} />

      {/* SHOWS BY MONTH */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-12 px-5 pt-12 lg:gap-16 lg:px-20 lg:pt-[88px]">
        {shows.length === 0 && <p className="border-y border-line py-8 text-[17px] leading-relaxed text-ink2 lg:text-xl">{empty}</p>}
        {[...months].map(([month, list]) => (
          <div key={month} className="flex flex-col gap-4 lg:gap-6">
            <h2 className="font-display text-[36px] leading-none first-letter:uppercase lg:text-[52px]">{month}</h2>
            <div className="flex flex-col">
              {list.map((show, i) => {
                return (
                  <ShowRow
                    key={show.id}
                    show={show}
                    ticketLabel={labels.ticket}
                    registrationLabel={labels.registration}
                    last={i === list.length - 1}
                    details={
                      <ShowDetails show={show} labels={labels} />
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-10">
          <ArrowLink link={allTicketsLink} className="self-start" />
          <ArrowLink link={repertoireLink} className="self-start" />
        </div>
      </section>

      <CtaBand {...cta} />
    </>
  );
}
