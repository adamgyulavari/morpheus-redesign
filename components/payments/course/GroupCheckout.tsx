import Link from 'next/link';

import CheckoutForm from '@/components/payments/CheckoutForm';
import CheckoutSummary from '@/components/payments/CheckoutSummary';
import { courseCheckoutAction } from '@/lib/payments/actions';
import { courseCheckoutPath } from '@/lib/payments/links';
import type { CheckoutMe } from '@/lib/payments/me';
import { paymentProvider } from '@/lib/payments/providers';
import { dueNow } from '@/lib/payments/service';
import type { Course, CourseStart } from '@/lib/types';

import { placesLeft, startLine } from './startText';

/** One group's checkout: its payment options, paid now in full or the first instalment. */
export default function GroupCheckout({
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
  const path = courseCheckoutPath(course.slug, start.code);
  const left = placesLeft(start);
  return (
    <CheckoutForm
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
          lines={[startLine(start)]}
          meta={
            <>
              {left}
              {canSwitch && (
                <>
                  {left && ' · '}
                  <Link href={courseCheckoutPath(course.slug)} className="link">
                    Másik csoport
                  </Link>
                </>
              )}
            </>
          }
        />
      }
      policy={[
        'A fizetéssel felveszünk a csoportba: e-mailben küldjük a részleteket, és a fiókodban is látod.',
        ...(start.options.some((o) => o.installments > 1)
          ? ['Részletfizetésnél most az első részletet fizeted, a többit a kurzus során.']
          : []),
      ]}
      me={me}
    />
  );
}
