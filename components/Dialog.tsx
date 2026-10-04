'use client';

/**
 * Modal built on the native <dialog> element (as in the static pages): showModal() gives focus
 * trapping, Esc to close and an inert background for free. Closes on Esc, the × button and a
 * click on the backdrop. Client component: it drives the element imperatively.
 */
import { useEffect, useRef, type ReactNode } from 'react';

import { CloseIcon } from './icons';

export default function Dialog({
  open,
  onClose,
  labelledBy,
  className,
  closeClassName = 'bg-paper',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className: string;
  closeClassName?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className={className}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the backdrop
      }}
    >
      {open && children}
      <button type="button" aria-label="Bezárás" className={`btn-icon absolute right-3 top-3 h-10 w-10 ${closeClassName}`} onClick={onClose}>
        <CloseIcon />
      </button>
    </dialog>
  );
}
