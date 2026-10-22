'use client';

/**
 * The checkout form, in two columns: on the left who (logged in, or name / e-mail / phone as in
 * the sign-up forms) and the billing details; on the right the order, the price (or a choice of
 * payment options), the terms and the pay button. Prices are the server's; the form only sends
 * which option.
 */
import Link from 'next/link';
import { type ReactNode, useActionState, useState } from 'react';

import { Card } from '@/components/account/Card';
import BillingFields from '@/components/forms/BillingFields';
import Checkbox from '@/components/forms/Checkbox';
import CountOptions from '@/components/forms/CountOptions';
import { RequiredMarks } from '@/components/forms/Field';
import Honeypot from '@/components/forms/Honeypot';
import Notice from '@/components/forms/Notice';
import { HaveAccount, PersonFields } from '@/components/forms/PersonFields';
import Submit from '@/components/forms/Submit';
import { LockIcon } from '@/components/icons';
import { tagged } from '@/components/tagged';
import { useUi } from '@/components/UiStrings';
import type { ApplicationKind } from '@/lib/applications/labels';
import { needsPhone } from '@/lib/applications/rules';
import { fill, formatHuf } from '@/lib/format';
import type { CheckoutState } from '@/lib/payments/actions';
import type { CheckoutMe } from '@/lib/payments/me';

/** A way to pay (a kezdő course's price option): what is due now, of the total. */
export type PayOption = { id: string; label: string; due: number; total: number; parts: number; note?: string };

type Props = {
  /** What is bought: a Nyitott Műhely date, a kezdő course or show tickets (whether a phone is needed). */
  kind: ApplicationKind;
  action: (state: CheckoutState, form: FormData) => Promise<CheckoutState>;
  /** What is being bought (the date's or group's public code…): sent back as is. */
  hidden: Record<string, string>;
  /** A fixed price, or a choice of options. */
  price?: number;
  /** Tickets: `price` is one ticket's, the person picks how many (sent as `jegyek`); `loginAfter`: the "Van már fiókod?" line's end. */
  perSeat?: { max: number; label: string; loginAfter: string };
  options?: PayOption[];
  defaultOption?: string;
  loginHref: string;
  /** The order: when (the card's heading), where, the places note (server-rendered). */
  summary: ReactNode;
  /** The cancellation rules in plain words (from the settings). */
  policy: string[];
  /** The payment provider as shown ("Biztonságos fizetés: <logo>"). */
  provider: { name: string; logo?: string };
  me: CheckoutMe;
};

const heading = 'font-display text-[28px] leading-tight';

export default function CheckoutForm({
  kind,
  action: submit,
  hidden,
  price = 0,
  perSeat,
  options,
  defaultOption,
  loginHref,
  summary,
  policy,
  provider,
  me,
}: Props) {
  const [state, action] = useActionState<CheckoutState, FormData>(submit, {});
  const [optionId, setOptionId] = useState(state.values?.opcio ?? defaultOption ?? options?.[0]?.id ?? '');
  const chosen = options?.find((o) => o.id === optionId);
  const [seats, setSeats] = useState(Number(state.values?.jegyek) || 1);
  const due = options ? (chosen?.due ?? 0) : price * (perSeat ? seats : 1);
  const v = (name: string) => state.values?.[name];
  const { checkout: t, profile, common } = useUi();
  const link = (href: string) => (chunk: string) => (
    <Link href={href} className="link font-semibold text-ink" target="_blank">
      {chunk}
    </Link>
  );

  return (
    <RequiredMarks>
      <form action={action} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Honeypot />

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className={heading}>{t.details}</h2>
            <PersonFields
              me={me}
              value={v}
              phoneRequired={needsPhone(kind)}
              guestNote={
                <HaveAccount
                  href={loginHref}
                  after={perSeat?.loginAfter ?? t.loginAfter}
                  className="text-[15px] leading-relaxed text-ink2"
                />
              }
            />
          </Card>

          <Card>
            <h2 className={heading}>{profile.billing}</h2>
            <p className="text-[15px] text-ink2">{t.billingIntro}</p>
            <BillingFields value={(key) => v(key === 'name' ? 'billingName' : key) ?? me?.billing[key]} />
          </Card>
        </div>

        {/* stays in view while the (longer, logged-out) form on the left scrolls; clear of the sticky header */}
        <Card className="lg:sticky lg:top-28">
          {summary}
          {options && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[15px] font-semibold">{t.payMode}</legend>
              {options.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line px-4 py-3 has-[:checked]:border-teal has-[:checked]:bg-teal/5"
                >
                  <input
                    type="radio"
                    name="opcio"
                    value={o.id}
                    checked={optionId === o.id}
                    onChange={() => setOptionId(o.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-teal"
                  />
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline justify-between gap-3 text-[15px] font-semibold">
                      {o.label}
                      <span className="whitespace-nowrap">{formatHuf(o.total)}</span>
                    </span>
                    {(o.note || o.parts > 1) && (
                      <span className="text-[13px] text-muted">
                        {o.parts > 1 ? fill(t.installments, { parts: o.parts, amount: formatHuf(o.due) }) : o.note}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {perSeat && (
            <label className="flex items-center justify-between gap-4 text-[15px] font-semibold">
              {perSeat.label}
              <select
                className="field w-[96px]"
                name="jegyek"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
              >
                <CountOptions max={perSeat.max} />
              </select>
            </label>
          )}
          <div className="flex items-center justify-between gap-4 border-y border-line py-4">
            <span className="text-[16px] font-semibold leading-none">
              {chosen && chosen.parts > 1 ? t.dueNow : t.due}
            </span>
            <span className="font-display text-[32px] leading-none">{formatHuf(due)}</span>
          </div>
          <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-snug text-muted">
            {policy.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Checkbox name="terms">
            {tagged(t.terms, { terms: link('/aszf/'), cancel: link('/aszf/#lemondasi-feltetelek') })}
          </Checkbox>
          <Notice error={state.error} />
          <Submit block>{due > 0 ? fill(t.pay, { amount: formatHuf(due) }) : common.signup}</Submit>
          <p className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-[13px] leading-none text-muted">
            <LockIcon className="relative top-[2px] block h-3.5 w-3.5 shrink-0" />
            <span>{t.secure}</span>
            {provider.logo ? (
              // biome-ignore lint/performance/noImgElement: a tiny SVG wordmark; next/image adds nothing
              <img src={provider.logo} alt={provider.name} className="block h-[13px] w-auto" />
            ) : (
              <span className="font-semibold text-ink2">{provider.name}</span>
            )}
          </p>
        </Card>
      </form>
    </RequiredMarks>
  );
}
