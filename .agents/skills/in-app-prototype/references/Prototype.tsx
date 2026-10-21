import * as Sentry from '@sentry/react';
import {
  Fragment,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type PrototypeVariants = Record<string, ReactNode>;

export type PrototypeProps = {
  variants: PrototypeVariants;
  scope: string;
  name?: string;
  replay?: boolean;
  position?: 'top' | 'bottom';
};

type Point = { x: number; y: number };
type Sample = { t: number; x: number; y: number };

const STYLE_ID = 'proto-picker-styles';
const IS_DEV = import.meta.env.DEV;
const EDGE = 24;
const SNAP = 56;
const DRAG_MIN = 3;
const FLICK_MIN = 0.35;
const COAST_STOP = 0.04;
const FRICTION = 0.91;
const SAMPLE_WINDOW = 80;
const reportedProductionRenders = new Set<string>();

const PICKER_CSS = `
.proto-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.12);
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}

.proto-picker[data-position="top"] {
  bottom: auto;
  top: 24px;
}

.proto-picker[data-free] {
  top: 0;
  left: 0;
  right: auto;
  bottom: auto;
}

.proto-picker[data-dragging],
.proto-picker[data-coasting] {
  will-change: transform;
}

.proto-picker[data-dragging] {
  cursor: grabbing;
}

.proto-picker[data-snapping] {
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.proto-picker-highlight {
  position: absolute;
  top: 4px;
  left: 0;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  will-change: transform;
}

.proto-picker[data-ready] .proto-picker-highlight {
  transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .proto-picker[data-snapping] { transition: none; }
  .proto-picker[data-ready] .proto-picker-highlight { transition: none; }
}

.proto-picker-handle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.35);
  cursor: grab;
  touch-action: none;
}

.proto-picker-handle:hover {
  color: rgba(255, 255, 255, 0.7);
}

.proto-picker[data-dragging] .proto-picker-handle {
  cursor: grabbing;
}

.proto-picker-handle-dots {
  width: 8px;
  height: 12px;
  background: radial-gradient(circle closest-side, currentColor 1.15px, transparent 1.25px) 0 0 / 4px 4px;
}

.proto-picker-scope {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 10px 0 8px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.proto-picker-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font: inherit;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.proto-picker-item:hover {
  color: rgba(255, 255, 255, 0.85);
}

.proto-picker-item:active {
  transform: scale(0.97);
}

.proto-picker-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.4);
  outline-offset: 2px;
}

.proto-picker-item[data-active] {
  color: #fff;
}

.proto-picker-divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.12);
}

.proto-picker-replay {
  padding: 0 10px;
  font-size: 14px;
}
`;

function ensureStyles() {
  if (typeof document === 'undefined') {
    return;
  }
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = PICKER_CSS;
}

function storageKey(name: string) {
  return `prototype:${name}`;
}

function posStorageKey(name: string) {
  return `prototype:${name}:pos:v2`;
}

function readStoredIndex(name: string, labels: string[]) {
  if (typeof sessionStorage === 'undefined') {
    return 0;
  }
  const stored = sessionStorage.getItem(storageKey(name));
  if (!stored) {
    return 0;
  }
  const index = labels.indexOf(stored);
  return index >= 0 ? index : 0;
}

function readStoredPos(name: string): Point | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(posStorageKey(name));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Point;
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number' || Number.isNaN(parsed.x) || Number.isNaN(parsed.y)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistPos(name: string, point: Point) {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(posStorageKey(name), JSON.stringify(point));
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest('.proto-picker')) {
    return false;
  }
  return Boolean(
    target.closest(
      'input, textarea, select, button, a[href], [contenteditable="true"], [tabindex]:not([tabindex="-1"]), [role="button"], [role="checkbox"], [role="combobox"], [role="listbox"], [role="menu"], [role="menuitem"], [role="option"], [role="radio"], [role="slider"], [role="spinbutton"], [role="switch"], [role="tab"], [role="textbox"], [role="tree"], [role="treeitem"]',
    ),
  );
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampDrag(x: number, y: number, el: HTMLElement): Point {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return {
    x: clamp(x, 0, Math.max(0, vw - w)),
    y: clamp(y, 0, Math.max(0, vh - h)),
  };
}

function maybeSnap(x: number, y: number, el: HTMLElement): Point {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  let nx = clamp(x, 0, Math.max(0, vw - w));
  let ny = clamp(y, 0, Math.max(0, vh - h));
  const distLeft = nx;
  const distRight = vw - (nx + w);
  const distTop = ny;
  const distBottom = vh - (ny + h);
  if (distLeft <= SNAP && distLeft <= distRight) {
    nx = Math.min(EDGE, Math.max(0, vw - w));
  } else if (distRight <= SNAP) {
    nx = Math.max(0, vw - w - EDGE);
  }
  if (distTop <= SNAP && distTop <= distBottom) {
    ny = Math.min(EDGE, Math.max(0, vh - h));
  } else if (distBottom <= SNAP) {
    ny = Math.max(0, vh - h - EDGE);
  }
  return { x: nx, y: ny };
}

function velocityFromSamples(samples: Sample[]): Point {
  if (samples.length < 2) {
    return { x: 0, y: 0 };
  }
  const last = samples[samples.length - 1];
  if (!last) {
    return { x: 0, y: 0 };
  }
  const cutoff = last.t - SAMPLE_WINDOW;
  let first = samples[0];
  for (const sample of samples) {
    if (sample.t >= cutoff) {
      first = sample;
      break;
    }
  }
  if (!first) {
    return { x: 0, y: 0 };
  }
  const dt = last.t - first.t;
  if (dt < 8) {
    return { x: 0, y: 0 };
  }
  return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt };
}

export function Prototype({
  variants,
  scope,
  name = 'default',
  replay = false,
  position = 'bottom',
}: PrototypeProps) {
  const labels = Object.keys(variants);
  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  const [activeLabel, setActiveLabel] = useState<string | undefined>(
    () => labels[readStoredIndex(name, labels)] ?? labels[0],
  );
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(false);
  const pickerRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const activeIndex = Math.max(0, labels.indexOf(activeLabel ?? ''));
  const indexRef = useRef(activeIndex);
  indexRef.current = activeIndex;
  const nameRef = useRef(name);
  const posRef = useRef<Point | null>(null);
  const coastRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    samples: Sample[];
  } | null>(null);

  const remount = useCallback(() => {
    setGeneration((current) => current + 1);
  }, []);

  const setActive = useCallback(
    (next: number) => {
      const currentLabels = labelsRef.current;
      if (next < 0 || next >= currentLabels.length) {
        return;
      }
      setActiveLabel(currentLabels[next]);
      setGeneration((current) => current + 1);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(storageKey(name), currentLabels[next] ?? '');
      }
    },
    [name],
  );

  const applyTransform = useCallback((el: HTMLElement, point: Point) => {
    posRef.current = point;
    el.setAttribute('data-free', '');
    el.style.transform = `translate(${point.x}px, ${point.y}px)`;
  }, []);

  const clearFree = useCallback((el: HTMLElement) => {
    posRef.current = null;
    el.removeAttribute('data-free');
    el.removeAttribute('data-snapping');
    el.removeAttribute('data-coasting');
    el.style.transform = '';
  }, []);

  const stopCoast = useCallback(() => {
    if (coastRef.current != null) {
      cancelAnimationFrame(coastRef.current);
      coastRef.current = null;
    }
    pickerRef.current?.removeAttribute('data-coasting');
  }, []);

  const settle = useCallback(
    (el: HTMLElement, point: Point) => {
      el.removeAttribute('data-coasting');
      const snapped = maybeSnap(point.x, point.y, el);
      const shouldAnimate =
        !prefersReducedMotion() && (snapped.x !== point.x || snapped.y !== point.y);
      if (shouldAnimate) {
        el.setAttribute('data-snapping', '');
        const done = (transitionEvent: TransitionEvent) => {
          if (transitionEvent.propertyName !== 'transform') {
            return;
          }
          el.removeEventListener('transitionend', done);
          el.removeAttribute('data-snapping');
        };
        el.addEventListener('transitionend', done);
      }
      applyTransform(el, snapped);
      persistPos(name, snapped);
    },
    [applyTransform, name],
  );

  const moveHighlight = useCallback(() => {
    const picker = pickerRef.current;
    const highlight = highlightRef.current;
    if (!picker || !highlight) {
      return;
    }
    const activeButton = picker.querySelector<HTMLElement>('.proto-picker-item[data-active]');
    if (!activeButton) {
      return;
    }
    highlight.style.width = `${activeButton.offsetWidth}px`;
    highlight.style.transform = `translateX(${activeButton.offsetLeft}px)`;
  }, []);

  const placePicker = useCallback(() => {
    const el = pickerRef.current;
    if (!el) {
      return;
    }
    stopCoast();
    const stored = readStoredPos(name);
    if (stored) {
      applyTransform(el, maybeSnap(stored.x, stored.y, el));
      return;
    }
    clearFree(el);
  }, [applyTransform, clearFree, name, stopCoast]);

  useEffect(() => {
    if (IS_DEV) {
      return;
    }
    if (reportedProductionRenders.has(name)) {
      return;
    }
    reportedProductionRenders.add(name);
    Sentry.captureException(new Error(`<Prototype name="${name}"> rendered in production`), {
      level: 'error',
      extra: { name },
    });
  }, [name]);

  useEffect(() => {
    const nameChanged = nameRef.current !== name;
    nameRef.current = name;
    if (nameChanged || activeLabel == null || !labels.includes(activeLabel)) {
      setActiveLabel(labels[readStoredIndex(name, labels)] ?? labels[0]);
    }
  }, [activeLabel, labels, name]);

  useEffect(() => {
    return () => {
      if (coastRef.current != null) {
        cancelAnimationFrame(coastRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!IS_DEV) {
      return;
    }
    ensureStyles();
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    if (!IS_DEV) {
      return;
    }
    placePicker();
  }, [placePicker, labels.length]);

  useLayoutEffect(() => {
    if (!IS_DEV) {
      return;
    }
    moveHighlight();
  }, [activeIndex, labels, replay, ready, moveHighlight]);

  useEffect(() => {
    if (!IS_DEV) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInteractiveTarget(event.target)) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const numeric = Number.parseInt(event.key, 10);
      if (numeric >= 1 && numeric <= labels.length) {
        event.preventDefault();
        setActive(numeric - 1);
        return;
      }
      if (event.key === 'ArrowRight') {
        if (labels.length === 0) {
          return;
        }
        event.preventDefault();
        setActive((indexRef.current + 1) % labels.length);
        return;
      }
      if (event.key === 'ArrowLeft') {
        if (labels.length === 0) {
          return;
        }
        event.preventDefault();
        setActive((indexRef.current - 1 + labels.length) % labels.length);
        return;
      }
      if (replay && (event.key === 'r' || event.key === 'R')) {
        event.preventDefault();
        remount();
      }
    };
    const onResize = () => {
      moveHighlight();
      const el = pickerRef.current;
      const pos = posRef.current;
      if (!el || !pos) {
        return;
      }
      const snapped = maybeSnap(pos.x, pos.y, el);
      el.removeAttribute('data-snapping');
      applyTransform(el, snapped);
      persistPos(name, snapped);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [applyTransform, labels.length, moveHighlight, name, replay, remount, setActive]);

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) {
      return;
    }
    const el = pickerRef.current;
    if (!el) {
      return;
    }
    event.preventDefault();
    stopCoast();
    const rect = el.getBoundingClientRect();
    const origin = posRef.current ?? { x: rect.left, y: rect.top };
    el.removeAttribute('data-snapping');
    applyTransform(el, origin);
    event.currentTarget.setPointerCapture(event.pointerId);
    el.setAttribute('data-dragging', '');
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: origin.x,
      origY: origin.y,
      samples: [{ t: performance.now(), x: event.clientX, y: event.clientY }],
    };
  };

  const onHandlePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;
    const el = pickerRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !el) {
      return;
    }
    const now = performance.now();
    drag.samples.push({ t: now, x: event.clientX, y: event.clientY });
    const cutoff = now - SAMPLE_WINDOW;
    drag.samples = drag.samples.filter((sample) => sample.t >= cutoff);
    applyTransform(
      el,
      clampDrag(drag.origX + (event.clientX - drag.startX), drag.origY + (event.clientY - drag.startY), el),
    );
  };

  const onHandlePointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;
    const el = pickerRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !el) {
      return;
    }
    dragRef.current = null;
    el.removeAttribute('data-dragging');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const moved =
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= DRAG_MIN;
    if (!moved && !readStoredPos(name)) {
      clearFree(el);
      return;
    }
    const current = posRef.current ?? { x: 0, y: 0 };
    drag.samples.push({
      t: performance.now(),
      x: event.clientX,
      y: event.clientY,
    });
    const velocity = velocityFromSamples(drag.samples);
    const speed = Math.hypot(velocity.x, velocity.y);
    if (prefersReducedMotion() || speed < FLICK_MIN) {
      settle(el, current);
      return;
    }
    el.setAttribute('data-coasting', '');
    let vx = velocity.x;
    let vy = velocity.y;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      const decay = FRICTION ** (dt / 16.67);
      vx *= decay;
      vy *= decay;
      const pos = posRef.current ?? current;
      const unclampedX = pos.x + vx * dt;
      const unclampedY = pos.y + vy * dt;
      const next = clampDrag(unclampedX, unclampedY, el);
      if (next.x !== unclampedX) {
        vx = 0;
      }
      if (next.y !== unclampedY) {
        vy = 0;
      }
      applyTransform(el, next);
      if (Math.hypot(vx, vy) < COAST_STOP) {
        coastRef.current = null;
        settle(el, next);
        return;
      }
      coastRef.current = requestAnimationFrame(tick);
    };
    coastRef.current = requestAnimationFrame(tick);
  };

  const onHandlePointerCancel = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;
    const el = pickerRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !el) {
      return;
    }
    dragRef.current = null;
    el.removeAttribute('data-dragging');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const moved =
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= DRAG_MIN;
    if (!moved && !readStoredPos(name)) {
      clearFree(el);
      return;
    }
    settle(el, posRef.current ?? { x: 0, y: 0 });
  };

  const resolvedActiveLabel = labels[activeIndex] ?? labels[0];
  const active = resolvedActiveLabel ? variants[resolvedActiveLabel] : null;

  if (!IS_DEV) {
    return null;
  }

  if (typeof document === 'undefined' || labels.length === 0) {
    return <>{active}</>;
  }

  const picker = (
    <nav
      ref={pickerRef}
      className="proto-picker"
      aria-label={`${scope} prototype variants`}
      data-position={position === 'top' ? 'top' : undefined}
      data-ready={ready ? '' : undefined}
    >
      <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true" />
      <span
        className="proto-picker-handle"
        aria-hidden="true"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerCancel}
      >
        <span className="proto-picker-handle-dots" />
      </span>
      <span className="proto-picker-scope">{scope}</span>
      <span className="proto-picker-divider" aria-hidden="true" />
      {labels.map((label, itemIndex) => (
        <button
          key={label}
          type="button"
          className="proto-picker-item"
          data-active={itemIndex === activeIndex ? '' : undefined}
          aria-current={itemIndex === activeIndex ? 'true' : undefined}
          onClick={() => setActive(itemIndex)}
        >
          {label}
        </button>
      ))}
      {replay ? (
        <>
          <span className="proto-picker-divider" aria-hidden="true" />
          <button
            type="button"
            className="proto-picker-item proto-picker-replay"
            aria-label="Replay animation (R)"
            onClick={remount}
          >
            ↻
          </button>
        </>
      ) : null}
    </nav>
  );

  return (
    <>
      <Fragment key={`${resolvedActiveLabel}-${generation}`}>
        {active}
      </Fragment>
      {createPortal(picker, document.body)}
    </>
  );
}
