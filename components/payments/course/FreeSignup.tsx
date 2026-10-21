import SignupDialog from '@/components/signup/SignupDialog';
import { getUi } from '@/lib/data';
import type { Course, CourseStart } from '@/lib/types';

import { groupLabel } from './startText';

/**
 * The way in without paying: a group without online payment, or none ("egyik időpont sem jó").
 * Nothing when neither is open.
 */
export default async function FreeSignup({
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
  const ui = await getUi();
  const t = ui.checkout;
  const any = groups.length > 0;
  return (
    <p className="text-[15px] text-ink2">
      {any ? t.freeOther : t.freeNone}{' '}
      <SignupDialog
        label={any ? t.freeSignup : t.freeWithoutGroup}
        buttonClassName="link font-semibold text-ink"
        target={{
          kind: 'beginner',
          title: course.title,
          courseId: Number(course.id),
          groups: groups.map((s) => ({ id: s.groupId, label: groupLabel(s, ui) })),
          noGroupLabel: withoutGroup ? ui.signup.noGroupBeginner : undefined,
          details: any ? undefined : [t.freeNoneDetails],
        }}
      />
    </p>
  );
}
