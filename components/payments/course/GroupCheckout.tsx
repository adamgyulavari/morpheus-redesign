import Link from 'next/link';

import CheckoutForm from '@/components/payments/CheckoutForm';
import CheckoutSummary from '@/components/payments/CheckoutSummary';
import { getUi } from '@/lib/data';
import { courseCheckoutAction } from '@/lib/payments/actions';
import { dueNow } from '@/lib/payments/checkout';
import { courseCheckoutPath } from '@/lib/payments/links';
import type { CheckoutMe } from '@/lib/payments/me';
import { paymentProvider } from '@/lib/payments/providers';
import type { Course, CourseStart } from '@/lib/types';

import { placesLeft, startLine } from './startText';

/** One group's checkout: its payment options, paid now in full or the first instalment. */
export default async function GroupCheckout({
  course,
  start,
  canSwitch,
  me,
}: {
  course: Course;
  start: CourseStart;
  /** Other groups with online payment are open: a link back to the choice. */
  canSwitch: boolean;
  me: CheckoutMe;
}) {
  const ui = await getUi();
  const path = courseCheckoutPath(course.slug, start.code);
  const left = placesLeft(start, ui);
  return (
    <CheckoutForm
      kind="beginner"
      action={courseCheckoutAction}
      hidden={{ csoport: start.code }}
      options={start.options.map((o) => ({
        id: o.id,
        label: o.label,
        total: o.amount,
        parts: o.installments,
        due: dueNow(o).amount,
        note: o.note,
      }))}
      defaultOption={(start.options.find((o) => o.highlighted) ?? start.options[0])?.id}
      loginHref={`/belepes?vissza=${encodeURIComponent(path)}`}
      provider={paymentProvider().brand}
      summary={
        <CheckoutSummary
          title={start.title}
          lines={[startLine(start, ui)]}
          meta={
            <>
              {left}
              {canSwitch && (
                <>
                  {left && ' · '}
                  <Link href={courseCheckoutPath(course.slug)} className="link">
                    {ui.checkout.otherGroup}
                  </Link>
                </>
              )}
            </>
          }
        />
      }
      policy={[
        ui.checkout.policyAdmit,
        ...(start.options.some((o) => o.installments > 1) ? [ui.checkout.policyInstallments] : []),
      ]}
      me={me}
    />
  );
}
