import { notFound } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import CheckoutNotice from '@/components/payments/CheckoutNotice';
import FreeSignup from '@/components/payments/course/FreeSignup';
import GroupCheckout from '@/components/payments/course/GroupCheckout';
import GroupChooser from '@/components/payments/course/GroupChooser';
import { canApplyWithoutGroup } from '@/lib/applications/rules';
import { getCurrentUser } from '@/lib/auth';
import { getCourses, getUi } from '@/lib/data';
import { checkoutMe } from '@/lib/payments/me';
import type { Course } from '@/lib/types';

// per visitor and per moment (places), never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).checkout.title);

/**
 * /fizetes/kurzus/<slug>?csoport=<code>: a kezdő group with online payment — your details on the
 * left; the group, its payment options, the terms and payment on the right. Without `csoport` (and
 * more than one such group): the groups to choose from. The free way (a group without payment, or
 * none) is the usual dialog, under either.
 */
export default async function CourseCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ csoport?: string }>;
}) {
  const [{ slug }, { csoport }] = await Promise.all([params, searchParams]);
  const course = (await getCourses()).find((c) => c.slug === slug);
  if (course?.signupMode !== 'beginner') notFound();
  return (
    <AccountShell eyebrow={(await getUi()).checkout.eyebrow} heading={`*${course.title}*`} wide>
      <Body course={course} csoport={csoport} />
    </AccountShell>
  );
}

async function Body({ course, csoport }: { course: Course; csoport?: string }) {
  const open = course.starts.filter((s) => s.signup.state === 'open');
  const paid = open.filter((s) => s.payOnline);
  // the free way, under every view
  const free = {
    course,
    groups: open.filter((s) => !s.payOnline),
    withoutGroup: canApplyWithoutGroup(course, 'beginner'),
  };

  const t = (await getUi()).checkout;
  if (!paid.length)
    return (
      <CheckoutNotice text={t.notOnline} back={{ href: course.url, label: t.backToCourse }}>
        <FreeSignup {...free} />
      </CheckoutNotice>
    );

  const start = paid.find((s) => s.code === csoport) ?? (paid.length === 1 ? paid[0] : undefined);
  if (!start)
    return (
      <GroupChooser course={course} groups={paid}>
        <FreeSignup {...free} />
      </GroupChooser>
    );

  return (
    <>
      <GroupCheckout
        course={course}
        start={start}
        canSwitch={paid.length > 1}
        me={checkoutMe(await getCurrentUser())}
      />
      <FreeSignup {...free} />
    </>
  );
}
