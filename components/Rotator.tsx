'use client';

/**
 * A few server-rendered cards in one place, one visible at a time: shuffled in the browser (the
 * pages are cached, the same for everyone), then the next one every few seconds. Pauses while
 * hovered or focused; with reduced motion it only shuffles.
 *
 * - `fade`: the cards cross-fade in one grid cell (the box keeps the tallest one's height).
 * - `slide`: the box (`className`, the card's frame) stays and eases to the next one's height while
 *   only the contents slide in from the right, easing out. After the last one the first comes again
 *   from the right (a copy of it, then a jump back).
 */
import { Children, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

const EVERY_MS = 6000;
const SLIDE_MS = 700;

function shuffled(count: number) {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  return order;
}

export default function Rotator({
  children,
  className = '',
  variant = 'fade',
  top,
}: {
  children: ReactNode;
  className?: string;
  variant?: 'fade' | 'slide';
  /** slide: above the sliding part, in the frame (what every card shares). */
  top?: ReactNode;
}) {
  const items = Children.toArray(children);
  const count = items.length;
  // the server's order first (no hydration mismatch), shuffled once mounted
  const [order, setOrder] = useState(() => items.map((_, i) => i));
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  // slide: no transition for the jump from the copy back to the first
  const [instant, setInstant] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const slides = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => setOrder(shuffled(count)), [count]);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setInstant(false);
      setAt((a) => (variant === 'slide' ? a + 1 : (a + 1) % count));
    }, EVERY_MS);
    return () => clearInterval(timer);
  }, [count, paused, variant]);

  // slide: on the copy of the first, jump back to the real one once it has slid in
  useEffect(() => {
    if (variant !== 'slide' || at < count) return;
    const t = setTimeout(() => {
      setInstant(true);
      setAt(0);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [at, count, variant]);

  // slide: the box follows the shown card's height (and when it reflows)
  useLayoutEffect(() => {
    if (variant !== 'slide') return;
    const el = slides.current[at];
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [at, variant]);

  const pause = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };

  if (variant === 'fade') {
    const shown = order[at] ?? 0;
    return (
      <div className={`grid ${className}`} {...pause}>
        {items.map((item, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: the cards are fixed for this render
            key={i}
            className={`col-start-1 row-start-1 transition-opacity duration-700 ${i === shown ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={i !== shown}
            inert={i !== shown}
          >
            {item}
          </div>
        ))}
      </div>
    );
  }

  // the cards in their shuffled order, then the first again
  const sequence = count > 1 ? [...order, order[0] as number] : order;
  const curve = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // the frame (`className`: the card's look) stays; the contents slide inside it, to its edges.
  // contain-inline-size: the strip of cards side by side mustn't widen the frame (a grid or flex
  // parent would otherwise make room for all of them)
  return (
    <div className={`overflow-hidden contain-inline-size ${className}`} {...pause}>
      {top}
      <div
        className="overflow-hidden"
        style={{ height, transition: instant ? 'none' : `height ${SLIDE_MS}ms ${curve}` }}
      >
        <div
          className="flex items-start"
          style={{
            transform: `translateX(-${at * 100}%)`,
            transition: instant ? 'none' : `transform ${SLIDE_MS}ms ${curve}`,
          }}
        >
          {sequence.map((index, i) => {
            const shown = i === at;
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: positions in the strip
                key={i}
                ref={(el) => {
                  slides.current[i] = el;
                }}
                className="w-full shrink-0"
                aria-hidden={!shown}
                inert={!shown}
              >
                {items[index]}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
