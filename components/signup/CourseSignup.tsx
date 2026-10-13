/**
 * A course's sign-up button, by its "Jelentkezés módja": the external link, the beginner sign-up
 * (for one group, or a choice of the open ones) or the professional application form.
 */
import { ButtonLink } from '@/components/ui';
import { monthDayShort, weekday } from '@/lib/dates';
import { momentText } from '@/lib/rooms/format';
import type { Course, CourseStart } from '@/lib/types';

import SignupDialog from './SignupDialog';

type Props = {
  course: Course;
  label: string;
  variant: 'primary' | 'outline' | 'gold' | 'cream' | 'outline-cream';
  size?: 'md' | 'lg';
  arrow?: boolean;
  className?: string;
  /** One start card's button: that group only (with its state: full, not yet open). */
  start?: CourseStart;
};

const groupLabel = (s: CourseStart) => `${s.title} — indul: ${monthDayShort(s.date)}, ${weekday(s.date)}`;
const startDetails = (s: CourseStart) =>
  [
    `Indul: ${monthDayShort(s.date)}, ${weekday(s.date)}${s.startTime ? ` · ${s.startTime}–${s.endTime}` : ''}`,
    s.signup.left != null ? `${s.signup.left} szabad hely` : undefined,
  ].filter(Boolean) as string[];

export default function CourseSignup({ course, label, variant, size = 'lg', arrow, className = '', start }: Props) {
  const buttonClassName = `btn btn-${size} btn-${variant} ${className}`;
  if (course.signupMode === 'external')
    return (
      <ButtonLink
        link={{ label, href: course.signupUrl }}
        variant={variant}
        size={size}
        arrow={arrow}
        className={className}
      />
    );

  const open = course.starts.filter((s) => s.signup.state === 'open');
  if (course.signupMode === 'professional') {
    return (
      <SignupDialog
        label={label}
        buttonClassName={buttonClassName}
        target={{
          kind: 'professional',
          title: course.title,
          courseGroupId: start?.groupId,
          groups: start ? undefined : open.map((s) => ({ id: s.groupId, label: groupLabel(s) })),
        }}
      />
    );
  }

  // beginner
  if (start) {
    if (start.signup.state === 'full')
      return <span className={`${buttonClassName} pointer-events-none opacity-60`}>Megtelt</span>;
    if (start.signup.state === 'notYet' && start.signup.opensAt)
      return (
        <span className="text-[15px] font-semibold text-ink2">Jelentkezés: {momentText(start.signup.opensAt)}-tól</span>
      );
    if (start.signup.state !== 'open') return null;
    return (
      <SignupDialog
        label={label}
        buttonClassName={buttonClassName}
        target={{
          kind: 'beginner',
          title: start.title,
          courseGroupId: start.groupId,
          details: startDetails(start),
          price: start.signup.price,
        }}
      />
    );
  }
  if (!open.length) return null;
  const only = open.length === 1 ? open[0] : undefined;
  return (
    <SignupDialog
      label={label}
      buttonClassName={buttonClassName}
      target={{
        kind: 'beginner',
        title: only ? only.title : course.title,
        courseGroupId: only?.groupId,
        details: only ? startDetails(only) : undefined,
        price: only?.signup.price,
        groups: only ? undefined : open.map((s) => ({ id: s.groupId, label: groupLabel(s) })),
      }}
    />
  );
}
