import SignupDialog from '@/components/signup/SignupDialog';
import type { Course, CourseStart } from '@/lib/types';

import { groupLabel } from './startText';

/**
 * The way in without paying: a group without online payment, or none ("egyik időpont sem jó").
 * Nothing when neither is open.
 */
export default function FreeSignup({
  course,
  groups,
  withoutGroup,
}: {
  course: Course;
  /** The open groups without online payment. */
  groups: CourseStart[];
  withoutGroup: boolean;
}) {
  if (!groups.length && !withoutGroup) return null;
  const any = groups.length > 0;
  return (
    <p className="text-[15px] text-ink2">
      {any ? 'Más időpont, vagy egyik sem jó?' : 'Egyik időpont sem jó?'}{' '}
      <SignupDialog
        label={any ? 'Jelentkezés' : 'Jelentkezés csoport nélkül'}
        buttonClassName="link font-semibold text-ink"
        target={{
          kind: 'beginner',
          title: course.title,
          courseId: Number(course.id),
          groups: groups.map((s) => ({ id: s.groupId, label: groupLabel(s) })),
          noGroupLabel: withoutGroup ? 'Egyik időpont sem jó — a következő csoportba' : undefined,
          details: any ? undefined : ['Amint indul a következő csoport, beosztunk, és e-mailben írunk.'],
        }}
      />
    </p>
  );
}
