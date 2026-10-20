'use client';

/**
 * A few server-rendered cards in one place, one visible at a time: shuffled in the browser (the
 * pages are cached, the same for everyone), then the next one every few seconds, cross-fading.
 * Pauses while hovered or focused; with reduced motion it only shuffles. All cards share one grid
 * cell, so the box keeps the tallest one's height.
 */
import { Children, type ReactNode, useEffect, useState } from 'react';

const EVERY_MS = 6000;

export default function Rotator({ children, className = '' }: { children: ReactNode; className?: string }) {
  const items = Children.toArray(children);
  // the server's order first (no hydration mismatch), shuffled once mounted
  const [order, setOrder] = useState(() => items.map((_, i) => i));
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    const shuffled = Array.from({ length: count }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j] as number, shuffled[i] as number];
    }
    setOrder(shuffled);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setAt((a) => (a + 1) % count), EVERY_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  const shown = order[at] ?? 0;
  return (
    <div
      className={`grid ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
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
