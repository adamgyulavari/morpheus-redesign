'use client';

/**
 * The checkout form, in two columns: on the left who (logged in, or name / e-mail / phone as in
 * the sign-up forms) and the billing details; on the right the order, the price, the terms and the
 * pay button. The price is the server's.
 */
import Link from 'next/link';
import { type ReactNode, useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Card } from '@/components/account/Card';
import { ArrowRight, LockIcon } from '@/components/icons';
import { formatHuf } from '@/lib/format';
import { type CheckoutState, checkoutAction } from '@/lib/payments/actions';

type BillingValues = {
  billingName: string;
  zip: string;
  city: string;
  address: string;
  country: string;
  taxNumber: string;
};

type Props = {
  /** The date's public code. */
  code: string;
  price: number;
  loginHref: string;
  /** The order: what, when, where (server-rendered). */
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

export default function CheckoutForm({ code, price, loginHref, summary, policy, provider, me }: Props) {
  const [state, action] = useActionState<CheckoutState, FormData>(checkoutAction, {});
  const v = (name: string) => state.values?.[name];
  const billing = (name: keyof BillingValues) => v(name) ?? me?.billing[name];

  return (
    <form action={action} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10">
      <input type="hidden" name="alkalom" value={code} />
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

      <Card>
        <h2 className={heading}>A jelentkezésed</h2>
        {summary}
        <div className="flex items-baseline justify-between gap-4 border-y border-line py-4">
          <span className="text-[16px] font-semibold">Fizetendő</span>
          <span className="font-display text-[32px] leading-none">{formatHuf(price)}</span>
        </div>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[14.5px] leading-relaxed text-ink2">
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
        <Submit>{price > 0 ? `Fizetés — ${formatHuf(price)}` : 'Jelentkezem'}</Submit>
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <LockIcon />
          <span>Biztonságos fizetés:</span>
          {provider.logo ? (
            // biome-ignore lint/performance/noImgElement: a tiny SVG wordmark; next/image adds nothing
            <img src={provider.logo} alt={provider.name} className="h-[13px] w-auto" />
          ) : (
            <span className="font-semibold text-ink2">{provider.name}</span>
          )}
        </p>
      </Card>
    </form>
  );
}
