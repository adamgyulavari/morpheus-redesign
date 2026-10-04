'use client';

/**
 * Shared horizontal slider (reviews, production photos): a scroll-snap track, prev/next buttons on
 * desktop and one dot per "page" of visible items — recalculated on resize, kept in sync with
 * scrolling. Items are marked with `data-slide`.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { ArrowLeft } from './icons';

export function useSnapSlider(): {
  trackRef: RefObject<HTMLDivElement | null>;
  pages: number;
  current: number;
  go: (page: number) => void;
} {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [perView, setPerView] = useState(1);
  const [current, setCurrent] = useState(0);

  const slides = () => Array.from(trackRef.current?.querySelectorAll<HTMLElement>('[data-slide]') ?? []);
  const step = () => {
    const [a, b] = slides();
    return a && b ? b.offsetLeft - a.offsetLeft : 1;
  };

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    setCurrent(atEnd ? pages - 1 : Math.min(pages - 1, Math.round(track.scrollLeft / step() / perView)));
  }, [pages, perView]);

  useEffect(() => {
    const layout = () => {
      const track = trackRef.current;
      if (!track) return;
      const pv = Math.max(1, Math.round((track.clientWidth + 8) / step()));
      setPerView(pv);
      setPages(Math.ceil(slides().length / pv));
    };
    layout();
    window.addEventListener('resize', layout);
    return () => window.removeEventListener('resize', layout);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => requestAnimationFrame(sync);
    sync();
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [sync]);

  const go = (page: number) => {
    const p = Math.max(0, Math.min(pages - 1, page));
    const all = slides();
    const target = all[Math.min(p * perView, all.length - 1)];
    const first = all[0];
    if (target && first) trackRef.current?.scrollTo({ left: target.offsetLeft - first.offsetLeft });
  };

  return { trackRef, pages, current, go };
}

/** Prev / dots / next row under a slider. Hidden when everything fits on one page. */
export function SliderControls({
  pages,
  current,
  go,
  prevLabel,
  nextLabel,
}: {
  pages: number;
  current: number;
  go: (page: number) => void;
  prevLabel: string;
  nextLabel: string;
}) {
  if (pages < 2) return null;
  return (
    <div className="flex items-center justify-center gap-5 pt-2">
      <button type="button" aria-label={prevLabel} className="btn-icon hidden lg:inline-flex" disabled={current === 0} onClick={() => go(current - 1)}>
        <ArrowLeft />
      </button>
      <div className="flex items-center">
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            type="button"
            className="flex h-11 w-8 items-center justify-center"
            aria-label={`${i + 1}. oldal`}
            aria-current={i === current}
            onClick={() => go(i)}
          >
            <span className={`block h-2.5 rounded-full transition-all duration-300 ${i === current ? 'w-[30px] bg-teal' : 'w-2.5 bg-[#c9b89c]'}`} />
          </button>
        ))}
      </div>
      <button type="button" aria-label={nextLabel} className="btn-icon hidden lg:inline-flex" disabled={current === pages - 1} onClick={() => go(current + 1)}>
        <span className="rotate-180">
          <ArrowLeft />
        </span>
      </button>
    </div>
  );
}
