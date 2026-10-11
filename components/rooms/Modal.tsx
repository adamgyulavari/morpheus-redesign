'use client';

/** A native modal <dialog> (focus trap, Escape to close) for the room calendars. */
import { type ReactNode, useEffect, useRef } from 'react';

import s from './calendar.module.css';

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={s.dialog} onClose={onClose} aria-label={title}>
      <h2>{title}</h2>
      {open && children}
    </dialog>
  );
}
