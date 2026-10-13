import type { ReactNode } from 'react';

import { whenText } from '@/lib/rooms/format';
import type { OverviewPractice } from '@/lib/rooms/student';

/** One of my practice bookings: when, where, what for, my note — and `action` (e.g. cancel). */
export default function OwnBooking({ booking: b, action }: { booking: OverviewPractice; action?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
      <span className="text-[15px]">
        <span className="font-semibold text-ink">{whenText(b.start, b.end, 'long')}</span>
        <span className="text-ink2">
          {' '}
          · {b.rooms}
          {b.owner && ` · ${b.owner}`}
        </span>
        {b.note && <span className="mt-1 block text-[14px] italic text-muted">„{b.note}”</span>}
      </span>
      {action}
    </li>
  );
}
