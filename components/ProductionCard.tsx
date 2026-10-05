import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';

import { showDateLine } from '@/lib/dates';
import type { Production, ShowWithRelations } from '@/lib/types';

import { ArrowRight } from './icons';
import Lines from './Lines';
import ProductionDetails from './ProductionDetails';
import SmartLink from './SmartLink';

function OnStageBadge({ label, desktop }: { label: string; desktop: boolean }) {
  return desktop ? (
    <span className="absolute right-3 top-3 hidden items-center gap-2 rounded-full bg-gold px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-deep xl:flex">
      <span className="h-2 w-2 rounded-full bg-rust" />
      {label}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 self-start rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-deep xl:hidden">
      <span className="h-[7px] w-[7px] rounded-full bg-rust" />
      {label}
    </span>
  );
}

/**
 * One production on /repertoar. Posters alternate left/right (`posterFirst`); on desktop the poster
 * column is balanced by <PosterFit>, with a blurred copy of the poster filling any spare height.
 */
export default function ProductionCard({
  production: p,
  nextShow,
  posterFirst,
  labels,
  upcomingShowsUrl,
}: {
  production: Production;
  nextShow?: ShowWithRelations;
  posterFirst: boolean;
  labels: { onStage: string; nextShow: string; more: string };
  upcomingShowsUrl: string;
}) {
  const posterCol = posterFirst ? 'xl:col-start-1' : 'xl:col-start-2';
  const textCol = posterFirst ? 'xl:col-start-2' : 'xl:col-start-1';
  const titleId = `production-${p.id}-title`;
  const named = p.cast.some((c) => c.role);

  return (
    <article
      className={`grid grid-cols-[132px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-[22px] border border-line bg-paper p-[18px] xl:gap-y-0 xl:overflow-hidden xl:rounded-[28px] xl:p-0 ${
        posterFirst ? 'xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : 'xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'
      }`}
    >
      {/* poster column: an in-flow sizer with the poster's own aspect ratio gives its natural height;
          PosterFit widens the column until the card is exactly that tall */}
      <div
        className={`relative col-start-1 row-start-1 xl:row-span-2 xl:overflow-hidden xl:bg-deep ${posterCol}`}
        data-poster={posterFirst ? 'first' : 'last'}
      >
        <div className="hidden xl:block" style={{ aspectRatio: `${p.poster.width} / ${p.poster.height}` }} aria-hidden="true" />
        <Image
          src={p.poster.src}
          alt=""
          aria-hidden="true"
          fill
          sizes="40vw"
          className="hidden scale-110 object-fill blur-2xl xl:block"
        />
        <Image
          src={p.poster.src}
          alt={p.poster.alt}
          width={p.poster.width}
          height={p.poster.height}
          sizes="(min-width: 1280px) 40vw, 132px"
          className="aspect-[5/7] h-full w-full rounded-[14px] bg-deep object-cover xl:absolute xl:inset-0 xl:rounded-none xl:bg-transparent"
        />
        {nextShow && <OnStageBadge label={labels.onStage} desktop />}
      </div>

      <div className={`col-start-2 row-start-1 flex flex-col justify-end gap-2 xl:gap-3 xl:px-[60px] xl:pt-11 ${textCol}`}>
        {nextShow && <OnStageBadge label={labels.onStage} desktop={false} />}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          {p.genre && (
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted xl:rounded-full xl:bg-sand xl:px-3 xl:py-1.5 xl:text-xs xl:text-deep">
              {p.genre}
            </span>
          )}
          <span className="hidden text-[13px] font-bold uppercase tracking-[0.14em] text-teal xl:inline">{p.byline}</span>
        </div>
        <h3 className="font-display text-[30px] leading-[1.02] xl:text-[60px] xl:leading-none">{p.title}</h3>
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-teal xl:hidden">{p.byline}</span>
      </div>

      <div className={`col-span-2 flex flex-col gap-4 xl:col-span-1 xl:row-start-2 xl:px-[60px] xl:pb-11 xl:pt-5 ${textCol}`}>
        {p.detailPage ? (
          // productions with their own page link there; the others open the popup
          <p className="text-[15.5px] leading-relaxed text-ink2 xl:text-lg xl:leading-[28px]">
            {p.summary}{' '}
            <Link href={`/repertoar/${p.slug}`} className="link font-bold text-teal">
              {labels.more}
            </Link>
          </p>
        ) : (
          <ProductionDetails summary={p.summary} label={labels.more} titleId={titleId}>
            <div className="flex items-end gap-4 pr-12 lg:gap-5">
              <Image
                src={p.poster.src}
                alt=""
                width={p.poster.width}
                height={p.poster.height}
                sizes="80px"
                className="h-28 w-20 shrink-0 rounded-[10px] bg-deep object-cover shadow-[0_10px_20px_-12px_rgba(11,58,63,0.6)]"
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal lg:text-xs">
                  {[p.genre, p.byline].filter(Boolean).join(' · ')}
                </span>
                <h2 id={titleId} className="font-display text-[34px] leading-none lg:text-[44px]">
                  {p.title}
                </h2>
              </div>
            </div>
            <div className="flex flex-col gap-3.5 border-t border-line pt-5 text-[15.5px] leading-relaxed text-ink2 lg:text-[17px]">
              {p.longDescription.map((para, i) => (
                <p key={i}>
                  <Lines text={para} />
                </p>
              ))}
            </div>
          </ProductionDetails>
        )}

        {p.credits.length > 0 && (
          <div className="flex flex-wrap gap-x-7 gap-y-1.5 text-sm xl:text-[15px]">
            {p.credits.map((c) => (
              <span key={c.label}>
                <span className="text-muted">{c.label}: </span>
                <span className="font-semibold">{c.name}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-line pt-3.5 xl:gap-4 xl:pt-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted xl:text-xs">{p.castLabel}</span>
          {named ? (
            <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3 xl:gap-x-8 xl:gap-y-4">
              {p.cast.map((c, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <dt className="font-display text-[17px] italic leading-tight text-deep xl:text-[19px]">
                    {c.role}
                    {c.roleNote && <span className="block font-sans text-xs not-italic text-muted">{c.roleNote}</span>}
                  </dt>
                  <dd className="text-sm font-semibold leading-snug xl:text-[15px]">
                    {c.names.map((name, k) => (
                      <Fragment key={name}>
                        {k > 0 && <span className="font-normal text-muted"> / </span>}
                        <span className="whitespace-nowrap">{name}</span>
                      </Fragment>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3 xl:gap-x-8 xl:gap-y-4">
              {p.cast.map((c) => (
                <li key={c.names.join('/')} className="text-sm font-semibold leading-snug xl:text-[15px]">
                  {c.names.join(' / ')}
                </li>
              ))}
            </ul>
          )}
          {p.note && <p className="text-xs leading-relaxed text-muted">{p.note}</p>}
        </div>

        {nextShow && (
          <SmartLink
            href={`${upcomingShowsUrl}#eloadas-${nextShow.id}`}
            className="on-dark group flex items-center justify-between gap-4 rounded-2xl bg-deep px-4 py-3.5 text-cream transition-colors hover:bg-deep2 xl:px-5 xl:py-4"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{labels.nextShow}</span>
              <span className="font-semibold">
                <span className="link-nav">{showDateLine(nextShow.date, nextShow.time)}</span>
              </span>
              <span className="text-sm text-mist">{nextShow.venue.name}</span>
            </span>
            <ArrowRight className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
          </SmartLink>
        )}
      </div>
    </article>
  );
}
