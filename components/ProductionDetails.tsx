'use client';

/**
 * A production's summary paragraph ending in the "Bővebben" link, plus the popup with its full
 * description. The popup's content is rendered on the server and passed in as children (server →
 * client props must be serializable, so it's ready-made JSX plus the id of its title); this
 * component only owns the open/closed state. The <dialog> is rendered next to the paragraph, not
 * inside it, because a <p> may not contain block elements.
 */
import { useState, type ReactNode } from 'react';

import Dialog from './Dialog';

export default function ProductionDetails({
  summary,
  label,
  titleId,
  children,
}: {
  summary: string;
  label: string;
  titleId: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className="text-[15.5px] leading-relaxed text-ink2 xl:text-lg xl:leading-[28px]">
        {summary}{' '}
        <button type="button" aria-haspopup="dialog" className="link font-bold text-teal" onClick={() => setOpen(true)}>
          {label}
        </button>
      </p>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        className="m-auto w-[min(92vw,640px)] rounded-[22px] border-0 bg-paper p-0 text-ink shadow-[0_30px_60px_-20px_rgba(8,31,34,0.6)] backdrop:bg-night/60 backdrop:backdrop-blur-[2px]"
        closeClassName="bg-paper lg:right-4 lg:top-4"
      >
        <div className="flex max-h-[85vh] flex-col gap-5 overflow-y-auto px-6 pb-8 pt-6 lg:px-10 lg:pb-10 lg:pt-9">{children}</div>
      </Dialog>
    </>
  );
}
