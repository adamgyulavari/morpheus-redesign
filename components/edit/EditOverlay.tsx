'use client';

/**
 * Edit buttons for staff on the live site (loaded by EditMode only for them):
 * - "Szerkesztés" (bottom left): this page's document in the admin, plus the site-wide settings;
 * - "Blokkok mutatása": the block under the pointer gets an outline and a "Blokk szerkesztése"
 *   button, which opens the page in the admin at that block (payload/components/BlockFocus.tsx).
 * Links open the admin in a new tab; the admin checks the real permissions. It reads the hidden
 * markers the pages render: `data-cms-doc` (the document) and `data-cms-block` (before each block).
 */
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PencilIcon } from '@/components/icons';

const ADMIN = '/admin';
const STORAGE_KEY = 'morpheus-edit-blocks';
const DOC_LABELS: Record<string, string> = { pages: 'Oldal szerkesztése', productions: 'Előadás szerkesztése' };

type Hovered = { el: HTMLElement; blockId: string };

/** The block under the pointer: the element right after a block marker. */
function blockAt(target: EventTarget | null): Hovered | null {
  for (let el = target instanceof HTMLElement ? target : null; el && el !== document.body; el = el.parentElement) {
    const marker = el.previousElementSibling;
    if (marker instanceof HTMLElement && marker.dataset.cmsBlock) return { el, blockId: marker.dataset.cmsBlock };
  }
  return null;
}

const menuItem = 'block w-full rounded-lg px-3 py-2 text-left text-[14px] font-medium text-ink hover:bg-sand';

export default function EditOverlay() {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);
  const [doc, setDoc] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    try {
      setShowBlocks(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {}
  }, []);

  // the page's document ("pages/12"), again after each client-side navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger — re-run after each navigation
  useEffect(() => {
    setDoc(document.querySelector<HTMLElement>('[data-cms-doc]')?.dataset.cmsDoc ?? null);
    setHovered(null);
    setOpen(false);
  }, [pathname]);

  const toggleBlocks = () => {
    const next = !showBlocks;
    setShowBlocks(next);
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {}
  };

  // the hovered block; moving onto the overlay itself (its button) keeps the current one
  useEffect(() => {
    if (!showBlocks) return setHovered(null);
    const onMove = (e: PointerEvent) => {
      if (root.current?.contains(e.target as Node)) return;
      const next = blockAt(e.target);
      setHovered((prev) => (prev?.el === next?.el ? prev : next));
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, [showBlocks]);

  // keep the outline on the block while scrolling / resizing
  const measure = useCallback(() => setRect(hovered ? hovered.el.getBoundingClientRect() : null), [hovered]);
  useEffect(() => {
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const docHref = doc && `${ADMIN}/collections/${doc}`;
  const docLabel = DOC_LABELS[doc?.split('/')[0] ?? ''] ?? 'Szerkesztés';
  // blocks are rows of a page (productions have a fixed layout)
  const blockHref =
    hovered && doc?.startsWith('pages/') ? `${docHref}?blokk=${encodeURIComponent(hovered.blockId)}` : null;

  return (
    <div ref={root} className="font-sans">
      {showBlocks && blockHref && rect && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[60] rounded-md border-2 border-dashed border-teal bg-teal/5"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          />
          {/* inside the block's top-right corner, so the pointer never leaves the block to reach it */}
          <a
            href={blockHref}
            target="_blank"
            rel="noopener"
            className="fixed z-[61] flex items-center gap-1.5 rounded-full bg-teal px-3.5 py-2 text-[13px] font-semibold text-cream shadow-[0_12px_32px_-12px_rgba(11,58,63,0.6)] hover:bg-deep"
            style={{ top: Math.max(rect.top + 8, 8), right: Math.max(window.innerWidth - rect.right + 8, 8) }}
          >
            <PencilIcon className="h-4 w-4" />
            Blokk szerkesztése
          </a>
        </>
      )}

      <div className="fixed bottom-4 left-4 z-[62] flex flex-col items-start gap-2">
        {open && (
          <div
            id="cms-edit-menu"
            className="w-60 rounded-2xl border border-line bg-paper p-2 shadow-[0_18px_40px_-18px_rgba(11,58,63,0.6)]"
          >
            {docHref && (
              <a href={docHref} target="_blank" rel="noopener" className={menuItem}>
                {docLabel}
              </a>
            )}
            <button type="button" onClick={toggleBlocks} className={menuItem} aria-pressed={showBlocks}>
              {showBlocks ? 'Blokkok elrejtése' : 'Blokkok mutatása'}
            </button>
            <hr className="my-1 border-line" />
            <a href={`${ADMIN}/globals/siteSettings`} target="_blank" rel="noopener" className={menuItem}>
              Beállítások (menü, lábléc)
            </a>
            <a href={`${ADMIN}/globals/ui`} target="_blank" rel="noopener" className={menuItem}>
              Felületi szövegek
            </a>
            <a href={ADMIN} target="_blank" rel="noopener" className={menuItem}>
              Admin felület
            </a>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="cms-edit-menu"
          className="flex items-center gap-2 rounded-full bg-deep px-4 py-2.5 text-[14px] font-semibold text-cream shadow-[0_12px_32px_-12px_rgba(11,58,63,0.7)] hover:bg-teal"
        >
          <PencilIcon />
          Szerkesztés
        </button>
      </div>
    </div>
  );
}
