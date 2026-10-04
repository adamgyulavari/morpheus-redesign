'use client';

/**
 * Desktop (≥1280px) repertoire cards: widen the poster column (40% → max 50%) just enough that the
 * text fits beside the poster, so each card is exactly as tall as its poster. If the text needs more
 * than 50%, the blurred poster backdrop fills the remaining height. Below 1280px the cards use the
 * stacked layout and nothing is adjusted.
 * Client component: it measures rendered heights, which only exist in the browser.
 */
import { useEffect, useRef, type ReactNode } from 'react';

const DESKTOP = '(min-width: 1280px)';

function fitCard(card: HTMLElement, desktop: boolean) {
  card.style.gridTemplateColumns = '';
  if (!desktop) return;
  const poster = card.querySelector<HTMLElement>('[data-poster]');
  const sizer = poster?.firstElementChild as HTMLElement | null;
  if (!poster || !sizer) return;
  const posterFirst = poster.dataset.poster === 'first';
  const set = (r: number) => {
    card.style.gridTemplateColumns = posterFirst
      ? `minmax(0,${r}fr) minmax(0,${1 - r}fr)`
      : `minmax(0,${1 - r}fr) minmax(0,${r}fr)`;
  };
  const fits = () => card.offsetHeight <= sizer.offsetHeight + 2;
  set(0.4);
  if (fits()) return;
  let lo = 0.4;
  let hi = 0.5;
  set(hi);
  if (!fits()) return;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    set(mid);
    if (fits()) hi = mid;
    else lo = mid;
  }
  set(hi);
}

export default function PosterFit({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP);
    const fitAll = () => ref.current?.querySelectorAll<HTMLElement>('article').forEach((card) => fitCard(card, media.matches));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(fitAll, 100);
    };
    fitAll();
    void document.fonts.ready.then(fitAll);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
