import Link from 'next/link';
import { notFound } from 'next/navigation';

import AccountShell, { Card } from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import { ArrowRight } from '@/components/icons';
import CheckoutForm from '@/components/payments/CheckoutForm';
import SignupDialog from '@/components/signup/SignupDialog';
import { canApplyWithoutGroup } from '@/lib/applications/rules';
import { getCurrentUser } from '@/lib/auth';
import { getCourses } from '@/lib/data';
import { monthDayShort, weekday } from '@/lib/dates';
import { courseCheckoutAction } from '@/lib/payments/actions';
import { courseCheckoutPath } from '@/lib/payments/links';
import { checkoutMe } from '@/lib/payments/me';
import { paymentProvider } from '@/lib/payments/providers';
import { dueNow } from '@/lib/payments/service';
import type { CourseStart } from '@/lib/types';

// per visitor and per moment (places), never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Jelentkezés és fizetés');

const startLine = (s: CourseStart) =>
  `Indul: ${monthDayShort(s.date)}, ${weekday(s.date)}${s.startTime ? ` · ${s.startTime}–${s.endTime}` : ''}`;
const groupLabel = (s: CourseStart) => `${s.title} — indul: ${monthDayShort(s.date)}, ${weekday(s.date)}`;

/**
 * /fizetes/kurzus/<slug>?csoport=<code>: a kezdő group with online payment — your details on the
 * left; the group, its payment options, the terms and payment on the right. Without `csoport`: the
 * groups to choose from. The free way (a group without payment, or none) is the usual dialog.
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
  const viewer = await getCurrentUser();

  const open = course.starts.filter((s) => s.signup.state === 'open');
  const paid = open.filter((s) => s.payOnline);
  const free = open.filter((s) => !s.payOnline);
  const withoutGroup = canApplyWithoutGroup(course, 'beginner');
  const start = paid.find((s) => s.code === csoport) ?? (paid.length === 1 ? paid[0] : undefined);

  // the free way: a group without online payment, or none ("egyik időpont sem jó")
  const freeWay =
    free.length || withoutGroup ? (
      <p className="text-[15px] text-ink2">
        {free.length ? 'Más időpont, vagy egyik sem jó?' : 'Egyik időpont sem jó?'}{' '}
        <SignupDialog
          label={free.length ? 'Jelentkezés' : 'Jelentkezés csoport nélkül'}
          buttonClassName="link font-semibold text-ink"
          target={{
            kind: 'beginner',
            title: course.title,
            courseId: Number(course.id),
            groups: free.map((s) => ({ id: s.groupId, label: groupLabel(s) })),
            noGroupLabel: withoutGroup ? 'Egyik időpont sem jó — a következő csoportba' : undefined,
            details: free.length ? undefined : ['Amint indul a következő csoport, beosztunk, és e-mailben írunk.'],
          }}
        />
      </p>
    ) : null;

  const notice = (text: string) => (
    <Card className="max-w-[680px]">
      <p className="text-[17px]">{text}</p>
      {freeWay}
      <Link href={course.url} className="link self-start font-semibold">
        Vissza a kurzushoz
      </Link>
    </Card>
  );

  return (
    <AccountShell eyebrow="Jelentkezés" heading={`*${course.title}*`} wide>
      {!paid.length ? (
        notice('Erre a kurzusra most nem online fizetéssel lehet jelentkezni.')
      ) : !start ? (
        <div className="flex max-w-[880px] flex-col gap-5">
          <h2 className="font-display text-[32px] leading-tight">Melyik csoportba jelentkezel?</h2>
          {paid.map((s) => (
            <Card key={s.code}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-display text-[26px] leading-tight">{s.title}</span>
                  <span className="text-[15px] text-ink2">{startLine(s)}</span>
                  <span className="text-[13px] text-muted">
                    {[s.signup.price, s.signup.left != null ? `${s.signup.left} szabad hely` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <Link href={courseCheckoutPath(course.slug, s.code)} className="btn btn-md btn-primary">
                  Ezt választom
                  <ArrowRight />
                </Link>
              </div>
            </Card>
          ))}
          {freeWay}
        </div>
      ) : (
        <>
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
            loginHref={`/belepes?vissza=${encodeURIComponent(courseCheckoutPath(course.slug, start.code))}`}
            provider={paymentProvider().brand}
            summary={
              <div className="flex flex-col gap-1.5">
                <h2 className="font-display text-[28px] leading-tight">{start.title}</h2>
                <p className="text-[16px] text-ink2">{startLine(start)}</p>
                <p className="text-[13px] text-muted">
                  {start.signup.left != null ? `${start.signup.left} szabad hely` : ''}
                  {paid.length > 1 && (
                    <>
                      {start.signup.left != null ? ' · ' : ''}
                      <Link href={courseCheckoutPath(course.slug)} className="link">
                        Másik csoport
                      </Link>
                    </>
                  )}
                </p>
              </div>
            }
            policy={[
              'A fizetéssel felveszünk a csoportba: e-mailben küldjük a részleteket, és a fiókodban is látod.',
              ...(start.options.some((o) => o.installments > 1)
                ? ['Részletfizetésnél most az első részletet fizeted, a többit a kurzus során.']
                : []),
            ]}
            me={checkoutMe(viewer)}
          />
          {freeWay}
        </>
      )}
    </AccountShell>
  );
}
