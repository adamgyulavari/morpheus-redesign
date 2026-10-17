import Link from 'next/link';
import { notFound } from 'next/navigation';

import AccountShell, { Card } from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import CheckoutForm from '@/components/payments/CheckoutForm';
import { canApplyWithoutGroup } from '@/lib/applications/rules';
import { getCurrentUser } from '@/lib/auth';
import { getCourses } from '@/lib/data';
import { monthDayShort, weekday } from '@/lib/dates';
import { courseCheckoutAction } from '@/lib/payments/actions';
import { courseCheckoutPath, NO_GROUP } from '@/lib/payments/links';
import { checkoutMe } from '@/lib/payments/me';
import { paymentProvider } from '@/lib/payments/providers';
import { dueNow } from '@/lib/payments/service';
import type { CourseStart } from '@/lib/types';

// per visitor and per moment (places), never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Jelentkezés és fizetés');

const startLine = (s: CourseStart) =>
  `Indul: ${monthDayShort(s.date)}, ${weekday(s.date)}${s.startTime ? ` · ${s.startTime}–${s.endTime}` : ''}`;

/**
 * /fizetes/kurzus/<slug>?csoport=<code>: a kezdő course with online payment — your details on the
 * left; the group, the payment option, the terms and payment on the right.
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
  const withoutGroup = canApplyWithoutGroup(course, 'beginner');
  const choices = [
    ...open.map((s) => ({
      code: s.code,
      title: s.title,
      line: startLine(s),
      note: s.signup.left != null ? `${s.signup.left} szabad hely` : undefined,
    })),
    ...(withoutGroup
      ? [
          {
            code: NO_GROUP,
            title: open.length ? 'Egyik időpont sem jó' : 'A következő induló csoport',
            line: 'Csoport nélkül jelentkezel; amint indul a következő, beosztunk.',
            note: undefined,
          },
        ]
      : []),
  ];
  const picked = choices.find((c) => c.code === csoport)?.code ?? (choices.length === 1 ? choices[0]?.code : undefined);

  const notice = (text: string) => (
    <Card className="max-w-[680px]">
      <p className="text-[17px]">{text}</p>
      <Link href={course.url} className="link self-start font-semibold">
        Vissza a kurzushoz
      </Link>
    </Card>
  );

  return (
    <AccountShell eyebrow="Jelentkezés" heading={`*${course.title}*`} wide>
      {!course.payOnline ? (
        notice('Erre a kurzusra a kurzus oldalán jelentkezhetsz.')
      ) : !choices.length ? (
        notice('Erre a kurzusra most nem lehet jelentkezni.')
      ) : (
        <CheckoutForm
          action={courseCheckoutAction}
          hidden={{ kurzus: course.slug }}
          options={course.prices.map((p) => ({
            id: p.id,
            label: p.label,
            total: p.amount,
            parts: p.installments,
            due: dueNow(p).amount,
            note: p.note,
          }))}
          defaultOption={(course.prices.find((p) => p.highlighted) ?? course.prices[0])?.id}
          loginHref={`/belepes?vissza=${encodeURIComponent(courseCheckoutPath(course.slug, picked))}`}
          provider={paymentProvider().brand}
          summary={
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 font-display text-[28px] leading-tight">Csoport</legend>
              {choices.map((c) => (
                <label
                  key={c.code}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line px-4 py-3 has-[:checked]:border-teal has-[:checked]:bg-teal/5"
                >
                  <input
                    type="radio"
                    name="csoport"
                    value={c.code}
                    defaultChecked={c.code === picked}
                    required
                    className="mt-1 h-4 w-4 shrink-0 accent-teal"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{c.title}</span>
                    <span className="text-[14px] text-ink2">{c.line}</span>
                    {c.note && <span className="text-[13px] text-muted">{c.note}</span>}
                  </span>
                </label>
              ))}
            </fieldset>
          }
          policy={[
            'A fizetéssel felveszünk a csoportba: e-mailben küldjük a részleteket, és a fiókodban is látod.',
            ...(course.prices.some((p) => p.installments > 1)
              ? ['Részletfizetésnél most az első részletet fizeted, a többit a kurzus során.']
              : []),
          ]}
          me={checkoutMe(viewer)}
        />
      )}
    </AccountShell>
  );
}
