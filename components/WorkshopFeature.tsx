import Image from 'next/image';

import { dateRange, weekdayRange } from '@/lib/dates';
import type { OpenWorkshopPage, Workshop } from '@/lib/types';

import DetailsDialog from './DetailsDialog';
import { ArrowRight } from './icons';
import { Eyebrow } from './ui';

/** An upcoming workshop/camp as a highlighted dark band, with the full details in a popup. */
export default function WorkshopFeature({ workshop: w, copy }: { workshop: Workshop; copy: OpenWorkshopPage['workshops'] }) {
  const titleId = `workshop-${w.id}-title`;
  const facts = [
    [copy.dateLabel, `${dateRange(w.startDate, w.endDate)} (${weekdayRange(w.startDate, w.endDate)})`],
    [copy.timeLabel, `${w.startTime}–${w.endTime}`],
    ...(w.leader ? [[copy.leaderLabel, w.leader.name]] : []),
  ];
  return (
    <article className="on-dark relative grid overflow-hidden rounded-[26px] bg-deep text-cream lg:grid-cols-[5fr_7fr] lg:rounded-[32px]">
      {/* the whole image is shown (workshop posters often carry text); a blurred copy fills spare height */}
      <div className="relative overflow-hidden bg-deep">
        <Image src={w.image.src} alt="" aria-hidden="true" fill sizes="40vw" className="hidden scale-110 object-cover opacity-60 blur-2xl lg:block" />
        <Image
          src={w.image.src}
          alt={w.image.alt}
          width={w.image.width}
          height={w.image.height}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="relative h-full w-full object-cover lg:object-contain"
        />
      </div>
      <div className="relative flex flex-col gap-6 overflow-hidden px-6 py-8 lg:gap-8 lg:p-14">
        <div className="sun absolute -right-24 -top-24 h-52 w-52 rounded-full opacity-85" aria-hidden="true" />
        <div className="relative flex flex-col gap-3 lg:gap-4">
          <Eyebrow dark>{w.kind}</Eyebrow>
          <h2 className="font-display text-[40px] leading-[1.02] lg:text-[60px] lg:leading-none">
            {w.title}
            {w.subtitle && <em className="block text-gold">{w.subtitle}</em>}
          </h2>
        </div>
        <p className="relative text-[17px] leading-relaxed text-mist lg:text-lg lg:leading-[28px]">{w.summary}</p>
        <dl className="relative flex flex-col text-[15px] lg:text-[17px]">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-t border-[#2b5a5e] py-3">
              <dt className="text-[#b9d2ce]">{label}</dt>
              <dd className="text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="relative flex flex-col gap-3 sm:flex-row">
          <a href={w.signupUrl} className="btn btn-lg btn-gold">
            {copy.signupLabel}
            <ArrowRight />
          </a>
          <DetailsDialog label={copy.moreLabel} titleId={titleId} buttonClassName="btn btn-lg btn-outline-cream">
            <div className="flex flex-col gap-2 pr-12">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal lg:text-xs">
                {w.kind} · {dateRange(w.startDate, w.endDate)}
              </span>
              <h2 id={titleId} className="font-display text-[34px] leading-none lg:text-[44px]">
                {w.title}
                {w.subtitle && <em className="block text-rust">{w.subtitle}</em>}
              </h2>
            </div>
            <div className="flex flex-col gap-3.5 border-t border-line pt-5 text-[15.5px] leading-relaxed text-ink2 lg:text-[17px]">
              {w.intro && <p className="font-semibold text-ink">{w.intro}</p>}
              <p>{w.summary}</p>
              <p>
                <span className="font-semibold text-ink">{copy.dateLabel}:</span> {dateRange(w.startDate, w.endDate)} ({weekdayRange(w.startDate, w.endDate)}),{' '}
                {copy.timeLabel.toLowerCase()} {w.startTime}–{w.endTime}
              </p>
            </div>
            {w.leader && (
              <div className="flex flex-col gap-3 border-t border-line pt-5">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{copy.leaderHeading}</span>
                {w.leader.bio.map((p) => (
                  <p key={p.slice(0, 24)} className="text-[15.5px] leading-relaxed text-ink2 lg:text-[17px]">
                    {p}
                  </p>
                ))}
              </div>
            )}
            {w.gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {w.gallery.map((img) => (
                  <Image key={img.src} src={img.src} alt={img.alt} width={img.width} height={img.height} sizes="320px" className="w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
            {w.closing && <p className="font-display text-[26px] italic leading-tight text-deep lg:text-[30px]">{w.closing}</p>}
            <a href={w.signupUrl} className="btn btn-lg btn-primary self-start">
              {copy.signupLabel}
              <ArrowRight />
            </a>
          </DetailsDialog>
        </div>
      </div>
    </article>
  );
}
