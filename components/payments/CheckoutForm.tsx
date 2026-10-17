'use client';

/**
 * The checkout form, in two columns: on the left who (logged in, or name / e-mail / phone as in
 * the sign-up forms) and the billing details; on the right the order, the price (or a choice of
 * payment options), the terms and the pay button. Prices are the server's; the form only sends
 * which option.
 */
import Link from 'next/link';
import { type ReactNode, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Card } from '@/components/account/Card';
import { ArrowRight, LockIcon } from '@/components/icons';
import { formatHuf } from '@/lib/format';
import type { CheckoutState } from '@/lib/payments/actions';

type BillingValues = {
  billingName: string;
  zip: string;
  city: string;
  address: string;
  country: string;
  taxNumber: string;
};

/** A way to pay (a kezdő course's price option): what is due now, of the total. */
export type PayOption = { id: string; label: string; due: number; total: number; parts: number; note?: string };

type Props = {
  action: (state: CheckoutState, form: FormData) => Promise<CheckoutState>;
  /** What is being bought (the date's or group's public code…): sent back as is. */
  hidden: Record<string, string>;
  /** A fixed price, or a choice of options. */
  price?: number;
  options?: PayOption[];
  defaultOption?: string;
  loginHref: string;
  /** The order: when (the card's heading), where, the places note (server-rendered). */
  summary: ReactNode;
  /** The cancellation rules in plain words (from the settings). */
  policy: string[];
  /** The payment provider as shown ("Biztonságos fizetés: <logo>"). */
  provider: { name: string; logo?: string };
  me: { name: string; email: string; phone: string; billing: BillingValues } | null;
};

function Submit({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-lg btn-primary w-full justify-center disabled:opacity-60"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? 'Egy pillanat…' : children}
      {!pending && <ArrowRight />}
    </button>
  );
}

const Field = ({
  label,
  name,
  value,
  required = true,
  ...rest
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: 'numeric' | 'text';
  maxLength?: number;
}) => (
  <label className="field-label">
    {label}
    {required ? ' *' : ''}
    <input className="field" name={name} required={required} defaultValue={value} {...rest} />
  </label>
);

const heading = 'font-display text-[28px] leading-tight';

export default function CheckoutForm({
  action: submit,
  hidden,
  price = 0,
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
  const due = options ? (chosen?.due ?? 0) : price;
  const v = (name: string) => state.values?.[name];
  const billing = (name: keyof BillingValues) => v(name) ?? me?.billing[name];

  return (
    <form action={action} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Weboldal
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className={heading}>Adataid</h2>
          {me ? (
            <>
              <p className="rounded-2xl bg-sand px-4 py-3 text-[15px] leading-relaxed text-ink2">
                Bejelentkezve: <strong className="font-semibold text-ink">{me.name}</strong> ({me.email})
              </p>
              <Field label="Telefonszám" name="phone" type="tel" autoComplete="tel" value={v('phone') ?? me.phone} />
            </>
          ) : (
            <>
              <p className="text-[15px] leading-relaxed text-ink2">
                Van már fiókod?{' '}
                <Link href={loginHref} className="link font-semibold text-ink">
                  Lépj be
                </Link>
                , és kitöltjük helyetted. Ha nincs, a jelentkezéssel létrehozzuk.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vezetéknév" name="lastName" autoComplete="family-name" value={v('lastName')} />
                <Field label="Keresztnév" name="firstName" autoComplete="given-name" value={v('firstName')} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="E-mail-cím" name="email" type="email" autoComplete="email" value={v('email')} />
                <Field label="Telefonszám" name="phone" type="tel" autoComplete="tel" value={v('phone')} />
              </div>
            </>
          )}
        </Card>

        <Card>
          <h2 className={heading}>Számlázási adatok</h2>
          <p className="text-[15px] text-ink2">A számlát e-mailben küldjük; ezek az adatok kerülnek rá.</p>
          <Field label="Név a számlán" name="billingName" autoComplete="name" value={billing('billingName')} />
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <Field
              label="Irányítószám"
              name="zip"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
              value={billing('zip')}
            />
            <Field label="Város" name="city" autoComplete="address-level2" value={billing('city')} />
          </div>
          <Field label="Cím (utca, házszám)" name="address" autoComplete="street-address" value={billing('address')} />
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <Field
              label="Ország"
              name="country"
              autoComplete="country"
              maxLength={2}
              value={billing('country') ?? 'HU'}
            />
            <Field label="Adószám (cégnek)" name="taxNumber" required={false} value={billing('taxNumber')} />
          </div>
        </Card>
      </div>

      {/* stays in view while the (longer, logged-out) form on the left scrolls; clear of the sticky header */}
      <Card className="lg:sticky lg:top-28">
        {summary}
        {options && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[15px] font-semibold">Fizetés módja</legend>
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
                      {o.parts > 1 ? `${o.parts} × ${formatHuf(o.due)} — most az első részletet fizeted` : o.note}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <div className="flex items-center justify-between gap-4 border-y border-line py-4">
          <span className="text-[16px] font-semibold leading-none">
            {chosen && chosen.parts > 1 ? 'Most fizetendő' : 'Fizetendő'}
          </span>
          <span className="font-display text-[32px] leading-none">{formatHuf(due)}</span>
        </div>
        <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-snug text-muted">
          {policy.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <label className="flex gap-3 text-[15px] leading-relaxed">
          <input type="checkbox" name="terms" required className="mt-1 h-5 w-5 shrink-0 accent-teal" />
          <span>
            Elolvastam és elfogadom az{' '}
            <Link href="/aszf/" className="link font-semibold" target="_blank">
              Általános Szerződési Feltételeket
            </Link>
            , benne a{' '}
            <Link href="/aszf/#lemondasi-feltetelek" className="link font-semibold" target="_blank">
              lemondási feltételeket
            </Link>
            . *
          </span>
        </label>
        {state.error && (
          <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[15px] font-semibold text-rust-dark">
            {state.error}
          </p>
        )}
        <Submit>{due > 0 ? `Fizetés — ${formatHuf(due)}` : 'Jelentkezem'}</Submit>
        <p className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-[13px] leading-none text-muted">
          <LockIcon className="relative top-[2px] block h-3.5 w-3.5 shrink-0" />
          <span>Biztonságos fizetés:</span>
          {provider.logo ? (
            // biome-ignore lint/performance/noImgElement: a tiny SVG wordmark; next/image adds nothing
            <img src={provider.logo} alt={provider.name} className="block h-[13px] w-auto" />
          ) : (
            <span className="font-semibold text-ink2">{provider.name}</span>
          )}
        </p>
      </Card>
    </form>
  );
}
