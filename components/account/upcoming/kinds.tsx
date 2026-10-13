/**
 * How each kind of upcoming item looks: its label, an icon and its colours (lib/rooms/labels.ts
 * KIND_PALETTE, shared with the room calendars).
 */
import type { ReactNode } from 'react';

import { BOOKING_KINDS, KIND_PALETTE, SESSION_KINDS } from '@/lib/rooms/labels';

import type { UpcomingKind } from './items';

type IconProps = { className?: string };

const svg = (children: ReactNode) =>
  function KindIcon({ className = 'h-[18px] w-[18px]' }: IconProps) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    );
  };

/** people: a class with the group */
const ClassIcon = svg(
  <>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 5a3 3 0 0 1 0 6M21 20c0-2.6-1.6-4.8-4-5.6" />
  </>,
);
/** a script page: rehearsal */
const RehearsalIcon = svg(
  <>
    <path d="M7 3h8l4 4v14H7z" />
    <path d="M15 3v4h4M10 12h6M10 16h4" />
  </>,
);
/** a star: a show */
const ShowIcon = svg(<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7z" />);
/** a tick in a circle: an exam */
const ExamIcon = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.8 2.8L16 9.5" />
  </>,
);
/** a door: practice in a room */
const PracticeIcon = svg(
  <>
    <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18" />
    <path d="M14.5 12h.01" strokeWidth={2.6} />
  </>,
);
/** an open door: an open workshop anyone can join */
const WorkshopIcon = svg(
  <>
    <path d="M4 21h16M7 21V5l7-2v18" />
    <path d="M14 5h3a1 1 0 0 1 1 1v15" />
    <path d="M11 12h.01" strokeWidth={2.6} />
  </>,
);
const OtherIcon = svg(<circle cx="12" cy="12" r="3.5" />);

export const KIND_STYLE: Record<
  UpcomingKind,
  { label: string; Icon: (p: IconProps) => ReactNode; ink: string; tint: string }
> = {
  course: { label: SESSION_KINDS.course, Icon: ClassIcon, ...KIND_PALETTE.course },
  rehearsal: { label: SESSION_KINDS.rehearsal, Icon: RehearsalIcon, ...KIND_PALETTE.rehearsal },
  show: { label: SESSION_KINDS.show, Icon: ShowIcon, ...KIND_PALETTE.show },
  exam: { label: SESSION_KINDS.exam, Icon: ExamIcon, ...KIND_PALETTE.exam },
  workshop: { label: SESSION_KINDS.workshop, Icon: WorkshopIcon, ...KIND_PALETTE.workshop },
  practice: { label: BOOKING_KINDS.practice, Icon: PracticeIcon, ...KIND_PALETTE.practice },
  other: { label: SESSION_KINDS.other, Icon: OtherIcon, ...KIND_PALETTE.other },
};

export const CANCELLED = { label: 'Elmarad', ink: KIND_PALETTE.exam.ink, tint: 'var(--color-sand)' };

/** The kind as a small coloured label with its icon ("Elmarad" when cancelled). */
export function KindLabel({ kind, cancelled }: { kind: UpcomingKind; cancelled?: boolean }) {
  const k = KIND_STYLE[kind];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em]"
      style={{ color: cancelled ? CANCELLED.ink : k.ink }}
    >
      <k.Icon className="h-4 w-4" />
      {cancelled ? CANCELLED.label : k.label}
    </span>
  );
}

/** The kind's icon in a tinted circle. */
export function KindBadge({ kind, cancelled }: { kind: UpcomingKind; cancelled?: boolean }) {
  const k = KIND_STYLE[kind];
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
      style={{ background: cancelled ? CANCELLED.tint : k.tint, color: cancelled ? 'var(--color-muted)' : k.ink }}
      title={k.label}
    >
      <k.Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

export const NoPlace = () => <span className="text-muted">helyszín egyeztetés alatt</span>;
