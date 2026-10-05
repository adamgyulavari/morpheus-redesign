'use client';

/**
 * The "post-it" review slider: a horizontal scroll-snap track, prev/next buttons on desktop and one
 * dot per "page" of visible cards (recalculated on resize, kept in sync with scrolling).
 * "Tovább olvasom" opens the full review in a popup styled like the note it came from.
 * Client component: scroll position, resize and the open popup are all browser state.
 */
import Image from 'next/image';
import { useState } from 'react';

import { fill } from '@/lib/format';
import type { Review } from '@/lib/types';

import Dialog from './Dialog';
import { SliderControls, useSnapSlider } from './SnapSlider';
import { PlaceholderAvatar } from './ui';
import { useUi } from './UiStrings';

/** Note colour, tilt and tape cycle by position (presentation only, not content). */
const NOTES = [
  { card: '-rotate-[1.5deg] border border-line bg-paper', tape: 'bg-[#f9c86a]/75 -rotate-3', text: 'text-ink2', bg: 'bg-paper' },
  { card: 'rotate-[1.2deg] bg-[#d3e7e3]', tape: 'bg-[#e0603a]/45 rotate-3', text: 'text-[#2c4447]', bg: 'bg-[#d3e7e3]' },
  { card: '-rotate-[0.7deg] bg-[#fbe3b0]', tape: 'bg-white/60 -rotate-2', text: 'text-[#3d3a2a]', bg: 'bg-[#fbe3b0]' },
  { card: 'rotate-[1.6deg] bg-[#d3e7e3]', tape: 'bg-[#f9c86a]/70 rotate-3', text: 'text-[#2c4447]', bg: 'bg-[#d3e7e3]' },
  { card: '-rotate-[1.2deg] bg-[#f6cdb8]', tape: 'bg-white/60 -rotate-2', text: 'text-[#44302a]', bg: 'bg-[#f6cdb8]' },
  { card: 'rotate-[0.9deg] border border-line bg-paper', tape: 'bg-[#f9c86a]/75 -rotate-3', text: 'text-ink2', bg: 'bg-paper' },
  { card: 'rotate-[1.4deg] bg-[#d3e7e3]', tape: 'bg-[#e0603a]/45 rotate-3', text: 'text-[#2c4447]', bg: 'bg-[#d3e7e3]' },
  { card: '-rotate-[1.7deg] bg-[#fbe3b0]', tape: 'bg-white/60 -rotate-2', text: 'text-[#3d3a2a]', bg: 'bg-[#fbe3b0]' },
] as const;
const note = (i: number) => NOTES[i % NOTES.length]!;

function Avatar({ review, border }: { review: Review; border: string }) {
  const ui = useUi();
  if (review.photo) {
    return (
      <Image
        src={review.photo.src}
        alt={review.photo.alt}
        width={48}
        height={48}
        className={`h-12 w-12 shrink-0 rounded-full border-[3px] object-cover ${border}`}
      />
    );
  }
  return <PlaceholderAvatar className={`h-12 w-12 border-[3px] ${border}`} label={fill(ui.reviews.photoPlaceholder, { name: review.name })} />;
}

function Caption({ review, nameId }: { review: Review; nameId?: string }) {
  return (
    <figcaption className="flex items-center gap-3">
      <Avatar review={review} border="border-paper" />
      <span className="flex flex-col gap-0.5">
        <span id={nameId} className="font-bold">
          {review.name}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] opacity-75">{review.label}</span>
      </span>
    </figcaption>
  );
}

export default function ReviewSlider({ reviews }: { reviews: Review[] }) {
  const { trackRef, pages, current, go } = useSnapSlider();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ui = useUi();

  const open = openIndex === null ? null : reviews[openIndex];

  return (
    <div className="lg:rounded-[32px] lg:bg-sand lg:px-11 lg:pb-7 lg:pt-8" aria-roledescription={ui.common.slideshow}>
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory items-start gap-4 overflow-x-auto scroll-smooth px-5 py-6 [scroll-padding-left:20px] sm:gap-6 lg:gap-8 lg:px-3.5 lg:[scroll-padding-left:14px]"
      >
        {reviews.map((review, i) => (
          <figure
            key={review.id}
            data-slide
            className={`${note(i).card} relative flex w-[82%] shrink-0 snap-start flex-col gap-4 rounded-[18px] px-6 pb-5 pt-7 text-ink shadow-[0_16px_30px_-20px_rgba(11,58,63,0.55)] sm:w-[calc(50%-12px)] lg:w-[calc((100%-64px)/3)]`}
          >
            <span className={`${note(i).tape} absolute -top-[11px] left-1/2 h-[22px] w-[86px] -translate-x-1/2`} aria-hidden="true" />
            <Caption review={review} />
            <blockquote className="font-display text-[23px] leading-[1.18] lg:text-[25px]">{review.quote}</blockquote>
            <button
              type="button"
              aria-haspopup="dialog"
              className="link min-h-[44px] self-start font-bold text-teal"
              onClick={() => setOpenIndex(i)}
            >
              {ui.common.readMore}
            </button>
          </figure>
        ))}
      </div>

      <SliderControls pages={pages} current={current} go={go} prevLabel={ui.reviews.previous} nextLabel={ui.reviews.next} />

      <Dialog
        open={open != null}
        onClose={() => setOpenIndex(null)}
        labelledBy="review-dialog-name"
        // the popup takes the colour of the note it was opened from
        className={`m-auto w-[min(92vw,540px)] overflow-visible rounded-[18px] border-0 p-0 text-ink shadow-[0_30px_60px_-20px_rgba(8,31,34,0.6)] backdrop:bg-night/60 backdrop:backdrop-blur-[2px] ${note(openIndex ?? 0).bg}`}
        closeClassName="bg-inherit"
      >
        {open && openIndex !== null && (
          <>
            <span className="absolute -top-[11px] left-1/2 h-[22px] w-[86px] -translate-x-1/2 -rotate-2 bg-[#f9c86a]/75" aria-hidden="true" />
            <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto px-6 pb-7 pt-7 lg:px-8 lg:pt-8">
              <div className="pr-12">
                <Caption review={open} nameId="review-dialog-name" />
              </div>
              <blockquote className="font-display text-[23px] leading-[1.18] lg:text-[25px]">{open.quote}</blockquote>
              <div className={`flex flex-col gap-3 text-[15.5px] leading-relaxed ${note(openIndex).text}`}>
                {open.fullText.map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
