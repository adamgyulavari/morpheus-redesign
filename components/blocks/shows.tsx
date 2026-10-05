import { ArrowRight } from '@/components/icons';
import PosterFit from '@/components/PosterFit';
import ProductionCard from '@/components/ProductionCard';
import { FilterGroup } from '@/components/RepertoireFilter';
import ShowDetails from '@/components/ShowDetails';
import ShowRow from '@/components/ShowRow';
import SmartLink from '@/components/SmartLink';
import { ArrowLink, Eyebrow } from '@/components/ui';
import { getNextShowByProduction, getProductions, getSiteSettings, getUi, getUpcomingShows } from '@/lib/data';
import { monthLong, showDateLine, year } from '@/lib/dates';
import { fill } from '@/lib/format';
import type { ShowWithRelations, UiStrings } from '@/lib/types';

import type { BlockProps } from './types';

function Rows({ shows, ui }: { shows: ShowWithRelations[]; ui: UiStrings }) {
  return (
    <div className="flex flex-col">
      {shows.map((show, i) => (
        <ShowRow
          key={show.id}
          show={show}
          ticketLabel={ui.shows.ticket}
          registrationLabel={ui.shows.registration}
          last={i === shows.length - 1}
          details={<ShowDetails show={show} labels={ui.shows} />}
        />
      ))}
    </div>
  );
}

/** Upcoming shows: one list under a heading (homepage), or grouped by month (/kozelgo-eloadasok). */
export async function UpcomingShows({ block, className }: BlockProps<'upcomingShows'>) {
  const [ui, shows] = await Promise.all([getUi(), getUpcomingShows()]);
  const byMonth = block.variant === 'byMonth';

  // group by month: "2026. október"
  const months = new Map<string, ShowWithRelations[]>();
  for (const show of shows) {
    const key = `${year(show.date)}. ${monthLong(show.date)}`;
    months.set(key, [...(months.get(key) ?? []), show]);
  }

  return (
    <section
      id={block.anchor}
      className={`mx-auto flex max-w-[1440px] flex-col px-5 lg:px-20 ${byMonth ? 'gap-12 lg:gap-16' : 'gap-6 lg:gap-12'} ${className}`}
    >
      {block.heading && (
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3.5 lg:gap-5">
            {block.eyebrow && <Eyebrow>{block.eyebrow}</Eyebrow>}
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">{block.heading}</h2>
          </div>
          {block.headerLink && <ArrowLink link={block.headerLink} className="hidden lg:inline-flex" />}
        </div>
      )}
      {shows.length === 0 ? (
        <p className="border-y border-line py-8 text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[28px]">{ui.shows.empty}</p>
      ) : byMonth ? (
        [...months].map(([month, list]) => (
          <div key={month} className="flex flex-col gap-4 lg:gap-6">
            <h2 className="font-display text-[36px] leading-none first-letter:uppercase lg:text-[52px]">{month}</h2>
            <Rows shows={list} ui={ui} />
          </div>
        ))
      ) : (
        <Rows shows={shows} ui={ui} />
      )}
      <div className={`flex flex-col gap-1 sm:flex-row ${byMonth ? 'sm:gap-10' : 'sm:gap-8'}`}>
        {block.headerLink && <ArrowLink link={block.headerLink} className="self-start lg:hidden" />}
        {block.links.map((link) => (
          <ArrowLink key={link.href} link={link} className="self-start" />
        ))}
      </div>
    </section>
  );
}

/** Dark banner: "Műsoron · 5 előadás a következő hetekben — next show", linking to the upcoming shows. */
export async function NextShowBanner({ block, className }: BlockProps<'nextShowBanner'>) {
  const [ui, upcoming] = await Promise.all([getUi(), getUpcomingShows()]);
  const next = upcoming[0];
  if (!next) return null;
  return (
    <section id={block.anchor} className={`mx-auto max-w-[1440px] px-5 lg:px-20 ${className}`}>
      <SmartLink
        href={block.link.href}
        className="on-dark group flex flex-col gap-4 rounded-[22px] bg-deep px-6 py-5 text-cream transition-colors hover:bg-deep2 sm:flex-row sm:items-center sm:justify-between lg:rounded-3xl lg:px-10 lg:py-7"
      >
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gold">
            <span className="h-2 w-2 rounded-full bg-rust" aria-hidden="true" />
            {ui.shows.onStage} · {fill(ui.shows.upcomingCount, { count: String(upcoming.length) })}
          </span>
          <span className="font-display text-[26px] leading-tight lg:text-[34px]">
            {next.production.title} <span className="text-mist">— {showDateLine(next.date, next.time)}</span>
          </span>
        </span>
        <span className="flex items-center gap-2 font-semibold">
          <span className="link-nav">{block.link.label}</span>
          <ArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </SmartLink>
    </section>
  );
}

/** The productions, one section per group (filterable by the hero's chips). Posters alternate left/right across the list. */
export async function Repertoire({ block, className }: BlockProps<'repertoire'>) {
  const [ui, productions, nextShows, settings] = await Promise.all([getUi(), getProductions(), getNextShowByProduction(), getSiteSettings()]);
  const position = new Map(productions.map((p, i) => [p.id, i]));
  const labels = { onStage: ui.shows.onStage, nextShow: ui.shows.nextShow, more: ui.common.more };
  return block.groups.map((group, gi) => (
    <FilterGroup
      key={group.group}
      group={group.group}
      id={gi === 0 ? block.anchor : undefined}
      className={`mx-auto flex max-w-[1440px] flex-col gap-6 px-5 lg:gap-11 lg:px-20 ${gi === 0 ? className : 'mt-16 lg:mt-[120px]'}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="flex flex-col gap-3.5">
          <Eyebrow>{group.eyebrow}</Eyebrow>
          <h2 className="font-display text-[40px] leading-[1.02] lg:text-[68px]">{group.heading}</h2>
        </div>
        <p className="text-[15px] leading-relaxed text-ink2 lg:max-w-[420px] lg:text-lg lg:leading-[28px]">{group.intro}</p>
      </div>
      <PosterFit className="flex flex-col gap-5 lg:gap-9">
        {productions
          .filter((p) => p.group === group.group)
          .map((production) => (
            <ProductionCard
              key={production.id}
              production={production}
              nextShow={nextShows.get(production.id)}
              posterFirst={(position.get(production.id) ?? 0) % 2 === 0}
              labels={labels}
              upcomingShowsUrl={settings.urls.upcomingShows}
            />
          ))}
      </PosterFit>
    </FilterGroup>
  ));
}
