'use client';

/**
 * Booking status of one open-workshop session ("Foglalás okt. 8., csütörtök éjfélig" + Foglalok, or
 * "Lezárult"). The page is regenerated only once a day, but booking closes at a specific midnight, so
 * the server-rendered status is re-checked in the browser against the visitor's clock.
 */
import { useEffect, useState } from 'react';

import { isOnOrBeforeInBudapest } from '@/lib/dates';

export default function SessionStatus({
  bookingDeadline,
  initiallyOpen,
  openText,
  closedText,
  bookLabel,
  closedLabel,
  bookingUrl,
}: {
  bookingDeadline: string;
  initiallyOpen: boolean;
  openText: string;
  closedText: string;
  bookLabel: string;
  closedLabel: string;
  bookingUrl: string;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  useEffect(() => setOpen(isOnOrBeforeInBudapest(bookingDeadline)), [bookingDeadline]);

  return (
    <>
      <span className="col-start-2 text-sm text-ink2 sm:col-start-auto lg:text-base">{open ? openText : closedText}</span>
      {open ? (
        <a href={bookingUrl} className="btn btn-md btn-outline col-span-2 sm:col-span-1">
          {bookLabel}
        </a>
      ) : (
        <span className="col-span-2 inline-flex h-12 items-center justify-center rounded-full bg-sand px-6 text-[15px] font-bold text-muted sm:col-span-1">
          {closedLabel}
        </span>
      )}
    </>
  );
}
