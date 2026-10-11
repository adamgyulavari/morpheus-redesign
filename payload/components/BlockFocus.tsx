'use client';

/**
 * Opens and scrolls to one block of the page being edited when the admin is opened from the live
 * site's edit overlay (`?blokk=<block id>`, components/edit/EditOverlay.tsx). The block is found by
 * its id, not its position: the latest draft may have blocks in a different order than the page.
 * Renders nothing.
 */
import { useForm, useFormFields } from '@payloadcms/ui';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

type Row = { id: string; collapsed?: boolean };

export function BlockFocus() {
  const blockId = useSearchParams().get('blokk');
  const rows = useFormFields(([fields]) => (fields.blocks as { rows?: Row[] } | undefined)?.rows);
  const { dispatchFields } = useForm();
  const opened = useRef(false);
  const index = blockId && rows ? rows.findIndex((r) => r.id === blockId) : -1;

  // open the row (blocks start collapsed)
  useEffect(() => {
    if (index < 0 || opened.current || !rows) return;
    opened.current = true;
    if (rows[index]!.collapsed !== false) {
      dispatchFields({ type: 'SET_ROW_COLLAPSED', path: 'blocks', updatedRows: rows.map((r, i) => (i === index ? { ...r, collapsed: false } : r)) });
    }
  }, [index, rows, dispatchFields]);

  // Scroll to it. The row has Payload's DOM id `blocks-row-<index>`; the blocks above it keep
  // growing for a moment (editors, images), so it is kept in view for ~3 s unless the user scrolls.
  // No "already done" flag: React Strict Mode (development) runs this twice, and the cleanup of the
  // first run stops its timer.
  useEffect(() => {
    if (index < 0) return;
    let userMoved = false;
    const stop = () => (userMoved = true);
    const events = ['wheel', 'touchmove', 'keydown', 'mousedown'] as const;
    events.forEach((e) => window.addEventListener(e, stop, { passive: true }));
    let ticks = 0;
    let highlighted = false;
    const timer = setInterval(() => {
      if (userMoved || ++ticks > 30) return clearInterval(timer);
      const el = document.getElementById(`blocks-row-${index}`);
      if (!el) return;
      el.scrollIntoView({ block: 'start' });
      if (!highlighted) {
        highlighted = true;
        el.style.transition = 'box-shadow 0.4s';
        el.style.boxShadow = '0 0 0 3px var(--theme-success-500, #0f5f63)';
        setTimeout(() => (el.style.boxShadow = ''), 3000);
      }
    }, 100);
    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [index]);

  return null;
}
