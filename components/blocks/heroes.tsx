import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import Emph from '@/components/Emph';
import { FilterChips } from '@/components/RepertoireFilter';
import Rotator from '@/components/Rotator';
import SmartLink from '@/components/SmartLink';
import { ButtonLink, Facts, HeroButtons, PageHero } from '@/components/ui';
import { getFeaturedShows, getPage, getProductions, getSiteSettings, getUi, getUpcomingWorkshops } from '@/lib/data';
import { showDateLine } from '@/lib/dates';
import type { ImageRef } from '@/lib/types';

import m from './heroMotion.module.css';
import LightRays from './LightRays';
import { resolveFacts } from './shared';
import type { BlockProps } from './types';

/**
 * Where the prints and the playbill hang from xl (a string from the top, its length, how it sways).
 * Below xl they hang in a row under the text, on short strings.
 */
type Slot = { place: string; drop: string; sway: [dur: string, delay: string, tilt: string]; print?: string };
const PRINT_SLOTS: Slot[] = [
  {
    place: 'xl:left-[3%] xl:w-[13%] xl:max-w-[230px]',
    drop: '120px',
    sway: ['6.5s', '-1s', '2.2deg'],
    print: '-rotate-[3deg]',
  },
  {
    place: 'xl:left-[14.5%] xl:w-[10%] xl:max-w-[180px]',
    drop: '330px',
    sway: ['7.5s', '-4s', '1.8deg'],
    print: 'rotate-[4deg]',
  },
  {
    place: 'xl:right-[4.5%] xl:w-[13%] xl:max-w-[230px]',
    drop: '80px',
    sway: ['7s', '-2.5s', '2deg'],
    print: 'rotate-[3deg]',
  },
];
const PLAYBILL_SLOT: Slot = {
  place: 'xl:right-[2.5%] xl:w-[19%] xl:max-w-[320px]',
  drop: '430px',
  sway: ['8s', '-6s', '1.2deg'],
};

/** Something hanging on a string, swaying a little (still for those who prefer reduced motion). */
function OnString({ slot, className, children }: { slot: Slot; className: string; children: ReactNode }) {
  const [dur, delay, tilt] = slot.sway;
  return (
    <div className={`xl:absolute xl:top-0 ${slot.place} ${className}`}>
      <div
        className={`${m.sway} flex flex-col items-center`}
        style={{ '--dur': dur, '--delay': delay, '--tilt': tilt, '--drop': slot.drop } as CSSProperties}
      >
        <span aria-hidden="true" className="h-6 w-px bg-gradient-to-b from-mist/10 to-mist/60 xl:h-(--drop)" />
        <span aria-hidden="true" className="-mb-1.5 h-3 w-3 rounded-full border-2 border-gold bg-night" />
        {children}
      </div>
    </div>
  );
}

/** A photo print: a cream border, the caption under it — like the ones pinned up in the green room. */
function Print({ photo, caption, className }: { photo: ImageRef; caption?: string; className: string }) {
  return (
    <figure
      className={`w-full bg-cream p-1.5 pb-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)] sm:p-2.5 sm:pb-3 ${className}`}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        priority
        sizes="(min-width: 1280px) 230px, 150px"
        className="aspect-[4/5] w-full object-cover"
      />
      {caption && (
        <figcaption className="pt-1.5 text-center font-display text-[14px] italic text-ink2 sm:pt-2 sm:text-[17px]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Homepage hero: a stage light on the heading, the photos hanging as prints at its sides and the
 * next shows as a playbill beside them (rotating). The text sits in a dark pool, so it reads.
 */
export async function HomeHero({ block, className }: BlockProps<'homeHero'>) {
  const [ui, settings, shows] = await Promise.all([
    getUi(),
    getSiteSettings(),
    block.nextShow ? getFeaturedShows() : [],
  ]);
  const prints = (block.photos ?? []).flatMap((p, i) => {
    const slot = PRINT_SLOTS[i];
    return slot ? [{ ...p, slot }] : [];
  });
  return (
    <section
      id={block.anchor}
      className={`on-dark relative isolate overflow-hidden bg-night xl:min-h-[800px] ${className}`}
    >
      <div aria-hidden="true" className="-z-10 absolute inset-0">
        <LightRays
          origin={[0.5, -0.1]}
          direction={[0, 1]}
          spread={0.34}
          intensity={0.7}
          colors={['#ffe2a8', '#eb6838']}
        />
      </div>
      <div
        aria-hidden="true"
        className="-z-10 absolute left-1/2 top-[10%] h-[60%] w-[110%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(8,31,34,0.85),rgba(8,31,34,0.4)_60%,transparent)] xl:top-[20%] xl:h-[66%] xl:w-[56%]"
      />
      <div className="mx-auto flex max-w-[720px] flex-col items-center gap-6 px-5 pb-10 pt-16 lg:gap-8 lg:pt-24 xl:min-h-[800px] xl:justify-center xl:py-0">
        <div className="flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold lg:gap-3.5 lg:text-[13px]">
          {block.keywords.map((word, i) => (
            <span key={word} className="contents">
              {i > 0 && (
                <span
                  className={`h-1.5 w-1.5 rounded-full lg:h-2 lg:w-2 ${i === 1 ? 'bg-[#f39a3d]' : 'bg-[#e0603a]'}`}
                  aria-hidden="true"
                />
              )}
              <span>{word}</span>
            </span>
          ))}
        </div>
        <h1 className="text-balance text-center font-display text-[54px] leading-[0.98] text-cream lg:text-[108px] lg:leading-[0.95]">
          <Emph text={block.heading} dark />
        </h1>
        <p className="text-center text-[17px] leading-relaxed text-cream/90 lg:max-w-[540px] lg:text-xl lg:leading-[28px]">
          {block.lead}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:gap-4">
          <ButtonLink link={block.primaryCta} variant="gold" arrow />
          <ButtonLink link={block.secondaryCta} variant="outline-cream" />
        </div>
      </div>
      {prints.length > 0 && (
        <div className="relative mx-auto flex max-w-[560px] items-start justify-center gap-[6%] px-5 pb-4 xl:static xl:max-w-none xl:p-0">
          {/* below xl: the line they hang from */}
          <span aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-mist/40 xl:hidden" />
          {prints.map((p) => (
            <OnString key={p.photo.src} slot={p.slot} className="w-[29%] max-w-[160px] xl:max-w-none">
              <Print photo={p.photo} caption={p.caption} className={p.slot.print ?? ''} />
            </OnString>
          ))}
        </div>
      )}
      {shows.length > 0 && (
        <OnString slot={PLAYBILL_SLOT} className="mx-auto w-full max-w-[400px] px-5 pb-14 xl:px-0 xl:pb-0">
          <Rotator
            variant="slide"
            className="w-full rounded-[18px] border border-white/15 bg-night/55 py-4 text-cream backdrop-blur-md transition-colors hover:border-gold lg:py-5"
            top={
              <span className="block px-5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold lg:px-[22px] lg:text-xs">
                {ui.shows.nextShow}
              </span>
            }
          >
            {shows.map((show) => (
              <SmartLink
                key={show.id}
                href={`${settings.urls.upcomingShows}#eloadas-${show.id}`}
                className="flex flex-col gap-1.5 px-5 lg:px-[22px]"
              >
                <span className="font-display text-[28px] leading-tight lg:text-[32px]">{show.production.title}</span>
                <span className="text-sm text-mist lg:text-[15px]">{showDateLine(show.date, show.time)}</span>
                <span className="text-sm text-mist/70">
                  {show.production.byline} · {show.venue.shortName}
                </span>
              </SmartLink>
            ))}
          </Rotator>
        </OnString>
      )}
    </section>
  );
}

/**
 * Segmented switch between sibling pages (e.g. Kezdő kurzus | Szakmai kurzus). Labels default to the
 * referenced pages' titles; the current page is highlighted.
 */
async function PageSwitcher({
  label,
  pages,
  current,
}: {
  label: string;
  pages: { path: string; label?: string }[];
  current: string;
}) {
  const items = await Promise.all(
    pages.map(async (p) => ({ path: p.path, label: p.label ?? (await getPage(p.path))?.title ?? p.path })),
  );
  return (
    <nav aria-label={label} className="flex self-start rounded-full border-[1.5px] border-[#cdbda3] bg-paper p-1">
      {items.map((item) => {
        const isCurrent = item.path === current;
        return (
          <Link
            key={item.path}
            href={item.path}
            aria-current={isCurrent ? 'page' : undefined}
            className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition-colors sm:px-5 ${
              isCurrent ? 'bg-teal text-cream' : 'text-teal hover:text-rust-dark'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The inner-page hero, with optional page switcher, facts, buttons and repertoire filter chips. */
export async function PageHeroBlock({ block, className, ctx }: BlockProps<'pageHero'>) {
  const conditional = block.buttons?.some((b) => b.showIf === 'upcomingWorkshops');
  const [facts, upcomingWorkshops, productions] = await Promise.all([
    block.facts ? resolveFacts(block.facts) : undefined,
    conditional ? getUpcomingWorkshops() : [],
    block.repertoireFilter ? getProductions() : [],
  ]);
  const buttons = block.buttons?.filter((b) => b.showIf !== 'upcomingWorkshops' || upcomingWorkshops.length > 0);
  return (
    <PageHero
      heading={block.heading}
      lead={block.lead}
      image={block.image}
      layout={block.layout}
      className={className}
      top={block.switcher && <PageSwitcher {...block.switcher} current={ctx.path} />}
    >
      {facts && <Facts facts={facts} />}
      {buttons && buttons.length > 0 && <HeroButtons buttons={buttons} />}
      {block.repertoireFilter && (
        <FilterChips
          counts={{
            all: productions.length,
            company: productions.filter((p) => p.group === 'company').length,
            students: productions.filter((p) => p.group === 'students').length,
          }}
        />
      )}
    </PageHero>
  );
}
