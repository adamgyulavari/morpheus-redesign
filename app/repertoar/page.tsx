import type { Metadata } from 'next';

import PosterFit from '@/components/PosterFit';
import ProductionCard from '@/components/ProductionCard';
import RepertoireFilter, { FilterChips, FilterGroup } from '@/components/RepertoireFilter';
import { ArrowRight } from '@/components/icons';
import SmartLink from '@/components/SmartLink';
import { CtaBand, Eyebrow, PageHero } from '@/components/ui';
import { getNextShowByProduction, getPageContent, getProductions, getSiteSettings, getUpcomingShows } from '@/lib/data';
import { showDateLine } from '@/lib/dates';
import { fill } from '@/lib/format';
import type { ProductionGroup } from '@/lib/types';

// Static page, regenerated at most once a day (ISR): "Műsoron" badges and next-show boxes follow
// the show dates without a redeploy.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('repertoar');
  return { title: meta.title, description: meta.description };
}

const GROUPS: ProductionGroup[] = ['company', 'students'];

export default async function RepertoirePage() {
  const [page, productions, nextShows, settings, upcoming] = await Promise.all([
    getPageContent('repertoar'),
    getProductions(),
    getNextShowByProduction(),
    getSiteSettings(),
    getUpcomingShows(),
  ]);
  const { hero, filter, groups, labels, cta } = page;
  const next = upcoming[0];
  const byGroup = (g: ProductionGroup) => productions.filter((p) => p.group === g);
  // posters alternate left/right across the whole list
  const position = new Map(productions.map((p, i) => [p.id, i]));

  return (
    <RepertoireFilter>
      <PageHero heading={hero.heading} lead={hero.lead} image={hero.image} layout={{ size: 'sm', tilt: -2, position: 'top', sun: 'top-right' }}>
        <FilterChips
          label={filter.label}
          chips={[
            { value: 'all', label: filter.all, count: productions.length },
            { value: 'company', label: filter.company, count: byGroup('company').length },
            { value: 'students', label: filter.students, count: byGroup('students').length },
          ]}
        />
      </PageHero>

      {/* ON STAGE → /kozelgo-eloadasok */}
      {next && (
        <section className="mx-auto max-w-[1440px] px-5 pt-10 lg:px-20 lg:pt-16">
          <SmartLink
            href={page.upcoming.link.href}
            className="on-dark group flex flex-col gap-4 rounded-[22px] bg-deep px-6 py-5 text-cream transition-colors hover:bg-deep2 sm:flex-row sm:items-center sm:justify-between lg:rounded-3xl lg:px-10 lg:py-7"
          >
            <span className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gold">
                <span className="h-2 w-2 rounded-full bg-rust" aria-hidden="true" />
                {page.upcoming.eyebrow} · {fill(page.upcoming.text, { count: String(upcoming.length) })}
              </span>
              <span className="font-display text-[26px] leading-tight lg:text-[34px]">
                {next.production.title} <span className="text-mist">— {showDateLine(next.date, next.time)}</span>
              </span>
            </span>
            <span className="flex items-center gap-2 font-semibold">
              <span className="link-nav">{page.upcoming.link.label}</span>
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </SmartLink>
        </section>
      )}

      {GROUPS.map((group, gi) => (
        <FilterGroup
          key={group}
          group={group}
          className={`mx-auto flex max-w-[1440px] flex-col gap-6 px-5 lg:gap-11 lg:px-20 ${gi === 0 ? 'pt-12 lg:pt-[88px]' : 'pt-16 lg:pt-[120px]'}`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="flex flex-col gap-3.5">
              <Eyebrow>{groups[group].eyebrow}</Eyebrow>
              <h2 className="font-display text-[40px] leading-[1.02] lg:text-[68px]">{groups[group].heading}</h2>
            </div>
            <p className="text-[15px] leading-relaxed text-ink2 lg:max-w-[420px] lg:text-lg lg:leading-[28px]">{groups[group].intro}</p>
          </div>
          <PosterFit className="flex flex-col gap-5 lg:gap-9">
            {byGroup(group).map((production) => (
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
      ))}

      <CtaBand {...cta} />
    </RepertoireFilter>
  );
}
