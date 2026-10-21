import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/account/Card';
import { ArrowRight } from '@/components/icons';
import { getUi } from '@/lib/data';
import { courseCheckoutPath } from '@/lib/payments/links';
import type { Course, CourseStart } from '@/lib/types';

import { placesLeft, startLine } from './startText';

/** The groups with online payment, each leading to its checkout. `children`: the free way, under them. */
export default async function GroupChooser({
  course,
  groups,
  children,
}: {
  course: Course;
  groups: CourseStart[];
  children?: ReactNode;
}) {
  const ui = await getUi();
  return (
    <div className="flex max-w-[880px] flex-col gap-5">
      <h2 className="font-display text-[32px] leading-tight">{ui.signup.group}</h2>
      {groups.map((s) => (
        <Card key={s.code}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-display text-[26px] leading-tight">{s.title}</span>
              <span className="text-[15px] text-ink2">{startLine(s, ui)}</span>
              <span className="text-[13px] text-muted">
                {[s.signup.price, placesLeft(s, ui)].filter(Boolean).join(' · ')}
              </span>
            </div>
            <Link href={courseCheckoutPath(course.slug, s.code)} className="btn btn-md btn-primary">
              {ui.checkout.pick}
              <ArrowRight />
            </Link>
          </div>
        </Card>
      ))}
      {children}
    </div>
  );
}
