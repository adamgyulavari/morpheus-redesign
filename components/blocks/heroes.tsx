import Image from 'next/image';
import Link from 'next/link';

import Emph from '@/components/Emph';
import Logo from '@/components/Logo';
import { FilterChips } from '@/components/RepertoireFilter';
import SmartLink from '@/components/SmartLink';
import { ButtonLink, Facts, HeroButtons, PageHero } from '@/components/ui';
import { getPage, getProductions, getSiteSettings, getUi, getUpcomingShows, getUpcomingWorkshops } from '@/lib/data';
import { showDateLine } from '@/lib/dates';

import { resolveFacts } from './shared';
import type { BlockProps } from './types';

/** Homepage hero: keywords, heading, buttons, the logo with photos, and the next-show card. */
export async function HomeHero({ block, className }: BlockProps<'homeHero'>) {
  const [ui, settings, [nextShow]] = await Promise.all([getUi(), getSiteSettings(), block.nextShow ? getUpcomingShows(1) : []]);
  return (
    <section
      id={block.anchor}
      className={`mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-12 pt-9 lg:grid-cols-2 lg:gap-12 lg:px-20 lg:pb-16 lg:pt-[72px] ${className}`}
    >
      <div className="order-2 flex flex-col gap-6 lg:order-1 lg:gap-8">
        <div className="flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-teal lg:justify-start lg:gap-3.5 lg:text-[13px]">
          {block.keywords.map((word, i) => (
            <span key={word} className="contents">
              {i > 0 && <span className={`h-1.5 w-1.5 rounded-full lg:h-2 lg:w-2 ${i === 1 ? 'bg-[#f39a3d]' : 'bg-[#e0603a]'}`} aria-hidden="true" />}
              <span>{word}</span>
            </span>
          ))}
        </div>
        <h1 className="text-balance text-center font-display text-[54px] leading-[0.98] lg:text-left lg:text-[108px] lg:leading-[0.95]">
          <Emph text={block.heading} />
        </h1>
        <p className="text-center text-[17px] leading-relaxed text-ink2 lg:max-w-[540px] lg:text-left lg:text-xl lg:leading-[28px]">{block.lead}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start lg:gap-4">
          <ButtonLink link={block.primaryCta} variant="primary" arrow />
          <ButtonLink link={block.secondaryCta} variant="outline" />
        </div>
      </div>

      <div className="relative order-1 lg:order-2">
        <div className="relative mx-auto aspect-square w-full max-w-[340px] lg:max-w-[560px]">
          <div className="pulse-ring" aria-hidden="true" />
          <div className="pulse-ring" aria-hidden="true" />
          <div className="pulse-ring" aria-hidden="true" />
          <Logo animated className="absolute inset-[16%] h-[68%] w-[68%]" />
          <Image
            src={block.imageLarge.src}
            alt={block.imageLarge.alt}
            width={block.imageLarge.width}
            height={block.imageLarge.height}
            priority
            sizes="(min-width: 1024px) 215px, 130px"
            className="absolute -right-[2%] -top-[6%] h-[38%] w-[38%] rounded-full border-[6px] border-paper object-cover shadow-[0_22px_44px_-20px_rgba(11,58,63,0.5)] lg:border-8"
          />
          <Image
            src={block.imageSmall.src}
            alt={block.imageSmall.alt}
            width={block.imageSmall.width}
            height={block.imageSmall.height}
            priority
            sizes="(min-width: 1024px) 165px, 100px"
            className="absolute bottom-[6%] right-[4%] h-[29%] w-[29%] rounded-full border-[5px] border-paper object-cover shadow-[0_22px_44px_-20px_rgba(11,58,63,0.5)] lg:border-[7px]"
          />
        </div>
        {nextShow && (
          <SmartLink
            href={`${settings.urls.upcomingShows}#eloadas-${nextShow.id}`}
            className="mt-6 flex flex-col gap-1.5 rounded-[18px] border border-line bg-paper px-5 py-4 shadow-[0_18px_40px_-18px_rgba(11,58,63,0.35)] transition-colors hover:border-teal lg:absolute lg:bottom-5 lg:left-0 lg:mt-0 lg:w-[272px] lg:px-[22px] lg:py-5"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-rust-dark lg:text-xs">{ui.shows.nextShow}</span>
            <span className="font-display text-[28px] leading-tight lg:text-[32px]">{nextShow.production.title}</span>
            <span className="text-sm text-ink2 lg:text-[15px]">{showDateLine(nextShow.date, nextShow.time)}</span>
            <span className="text-sm text-muted">
              {nextShow.production.byline} · {nextShow.venue.shortName}
            </span>
          </SmartLink>
        )}
      </div>
    </section>
  );
}

/**
 * Segmented switch between sibling pages (e.g. Kezdő kurzus | Szakmai kurzus). Labels default to the
 * referenced pages' titles; the current page is highlighted.
 */
async function PageSwitcher({ label, pages, current }: { label: string; pages: { path: string; label?: string }[]; current: string }) {
  const items = await Promise.all(pages.map(async (p) => ({ path: p.path, label: p.label ?? (await getPage(p.path))?.title ?? p.path })));
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
