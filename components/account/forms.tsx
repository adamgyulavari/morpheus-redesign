'use client';

/**
 * The account forms. Each posts to a Server Action (lib/account-actions.ts) and shows its answer;
 * the fields keep what was typed when the action returns an error.
 */
import Link from 'next/link';
import { useActionState, useState } from 'react';

import BillingFields from '@/components/forms/BillingFields';
import Checkbox from '@/components/forms/Checkbox';
import { Field, RequiredMarks, TextField } from '@/components/forms/Field';
import Honeypot from '@/components/forms/Honeypot';
import Notice from '@/components/forms/Notice';
import Submit from '@/components/forms/Submit';
import {
  confirmMagicLink,
  type FormState,
  forgotPassword,
  login,
  loginWithCode,
  register,
  resetPassword,
  sendMagicLink,
  updateBilling,
  updateProfile,
} from '@/lib/account-actions';
import type { Billing } from '@/lib/payments/billing';

const initial: FormState = {};

const v = (state: FormState, key: string) => state.values?.[key];

// ── /belepes ────────────────────────────────────────────────────────────────

/** Password login, with "send me a login link" (+ the code from that e-mail) as the alternative. */
export function LoginForms({ returnTo, info }: { returnTo: string; info?: string }) {
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [loginState, loginAction] = useActionState(login, initial);
  const [linkState, linkAction] = useActionState(sendMagicLink, initial);
  const [codeState, codeAction] = useActionState(loginWithCode, initial);

  if (mode === 'link' && linkState.done) {
    // the link was sent: it can be opened on any device; here, the code from the same e-mail works
    return (
      <form action={codeAction} className="flex flex-col gap-4 lg:gap-5">
        <h2 className="font-display text-[32px] leading-none lg:text-[40px]">Nézd meg a postafiókod</h2>
        <Notice message={linkState.message} />
        <p className="text-[15px] leading-relaxed text-ink2">
          Kattints a levélben lévő gombra, vagy ha a levelet másik eszközön olvasod, írd be ide a benne lévő 6 jegyű
          kódot.
        </p>
        <Notice error={codeState.error} />
        <input type="hidden" name="email" value={linkState.values?.email ?? ''} />
        <input type="hidden" name="vissza" value={returnTo} />
        <TextField
          label="Belépési kód"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          placeholder="123 456"
          className="max-w-[220px] text-center text-2xl font-semibold tracking-[0.3em] placeholder:font-normal placeholder:text-muted/40"
        />
        <Submit>Belépés a kóddal</Submit>
        <ToPassword onClick={() => setMode('password')} />
      </form>
    );
  }

  if (mode === 'link') {
    return (
      <form action={linkAction} className="flex flex-col gap-4 lg:gap-5">
        <h2 className="font-display text-[32px] leading-none lg:text-[40px]">Belépési link</h2>
        <p className="text-[15px] leading-relaxed text-ink2">
          Megadod az e-mail-címed, és küldünk egy linket és egy kódot, amellyel jelszó nélkül beléphetsz. 15 percig
          érvényesek.
        </p>
        <Notice {...linkState} />
        <TextField
          label="E-mail-cím"
          type="email"
          name="email"
          autoComplete="email"
          value={v(linkState, 'email') ?? v(loginState, 'email')}
        />
        <Submit>Belépési link küldése</Submit>
        <ToPassword onClick={() => setMode('password')} />
      </form>
    );
  }

  return (
    <form action={loginAction} className="flex flex-col gap-4 lg:gap-5">
      <h2 className="font-display text-[32px] leading-none lg:text-[40px]">Belépés jelszóval</h2>
      <Notice error={loginState.error} message={loginState.message ?? info} />
      <input type="hidden" name="vissza" value={returnTo} />
      <TextField label="E-mail-cím" type="email" name="email" autoComplete="email" value={v(loginState, 'email')} />
      <TextField label="Jelszó" type="password" name="password" autoComplete="current-password" />
      <Submit>Belépés</Submit>
      <div className="flex flex-col gap-2 text-[15px] sm:flex-row sm:gap-6">
        <button type="button" className="link self-start font-semibold" onClick={() => setMode('link')}>
          Belépési link küldése
        </button>
        <Link href="/elfelejtett-jelszo" className="link self-start font-semibold">
          Elfelejtettem a jelszavam
        </Link>
      </div>
    </form>
  );
}

const ToPassword = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="link self-start text-[15px] font-semibold" onClick={onClick}>
    Inkább jelszóval lépek be
  </button>
);

/** /belepes/link: whose login it is, and the button that uses up the link. */
export function MagicLinkConfirm({ token, email, next }: { token: string; email: string; next?: string }) {
  const [state, action] = useActionState(confirmMagicLink, initial);
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <Notice {...state} />
      <p className="text-[17px] leading-relaxed text-ink2">
        Belépés ezzel a fiókkal: <strong className="font-semibold text-ink">{email}</strong>
      </p>
      <input type="hidden" name="token" value={token} />
      {next && <input type="hidden" name="next" value={next} />}
      <Submit>Belépés</Submit>
      <p className="text-sm text-muted">Nem te kérted? Csukd be ezt az oldalt, és nem történik semmi.</p>
    </form>
  );
}

// ── /regisztracio ───────────────────────────────────────────────────────────

export function RegisterForm() {
  const [state, action] = useActionState(register, initial);
  if (state.done) {
    return (
      <div className="flex flex-col gap-4">
        <Notice {...state} />
        <p className="text-[15px] text-ink2">Nem jött meg a levél? Nézd meg a spam mappát is, vagy írj nekünk.</p>
      </div>
    );
  }
  return (
    <RequiredMarks>
      <form action={action} className="flex flex-col gap-4 lg:gap-5">
        <p className="text-sm text-muted">A csillaggal (*) jelölt mezők kitöltése kötelező.</p>
        <Notice {...state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Vezetéknév" name="lastName" autoComplete="family-name" value={v(state, 'lastName')} />
          <TextField label="Keresztnév" name="firstName" autoComplete="given-name" value={v(state, 'firstName')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="E-mail-cím" type="email" name="email" autoComplete="email" value={v(state, 'email')} />
          <TextField
            label="Telefonszám"
            type="tel"
            name="phone"
            required={false}
            autoComplete="tel"
            value={v(state, 'phone')}
          />
        </div>
        <TextField
          label="Jelszó"
          hint="(legalább 8 karakter)"
          type="password"
          name="password"
          minLength={8}
          autoComplete="new-password"
        />
        <Honeypot />
        <Checkbox name="privacy">
          Elolvastam és elfogadom az{' '}
          <Link href="/adatkezelesi-tajekoztato/" className="link font-semibold text-ink" target="_blank">
            adatkezelési tájékoztatót
          </Link>
          .
        </Checkbox>
        <Submit>Regisztrálok</Submit>
        <p className="text-[15px] text-ink2">
          Van már fiókod?{' '}
          <Link href="/belepes" className="link font-semibold text-ink">
            Belépés
          </Link>
        </p>
      </form>
    </RequiredMarks>
  );
}

// ── /elfelejtett-jelszo, /jelszo-visszaallitas ──────────────────────────────

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPassword, initial);
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <Notice {...state} />
      {!state.done && (
        <>
          <TextField label="E-mail-cím" type="email" name="email" autoComplete="email" value={v(state, 'email')} />
          <Submit>Visszaállító link küldése</Submit>
        </>
      )}
      <Link href="/belepes" className="link self-start text-[15px] font-semibold">
        Vissza a belépéshez
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initial);
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <Notice {...state} />
      <input type="hidden" name="token" value={token} />
      <TextField
        label="Új jelszó"
        hint="(legalább 8 karakter)"
        type="password"
        name="password"
        minLength={8}
        autoComplete="new-password"
      />
      <TextField
        label="Új jelszó még egyszer"
        type="password"
        name="confirm"
        minLength={8}
        autoComplete="new-password"
      />
      <Submit>Jelszó mentése</Submit>
    </form>
  );
}

// ── /fiokom ─────────────────────────────────────────────────────────────────

export function ProfileForm({
  user,
  google,
}: {
  user: { email: string; firstName: string; lastName: string; phone?: string | null };
  /** "Google-fiók csatolva", when it is. */
  google?: string;
}) {
  const [state, action] = useActionState(updateProfile, initial);
  const value = (key: 'firstName' | 'lastName' | 'phone') => v(state, key) ?? user[key] ?? '';
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <h2 className="font-display text-[32px] leading-none lg:text-[40px]">Adataim</h2>
      <Notice {...state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Vezetéknév" name="lastName" autoComplete="family-name" value={value('lastName')} />
        <TextField label="Keresztnév" name="firstName" autoComplete="given-name" value={value('firstName')} />
      </div>
      <div className="grid gap-4">
        <Field label="E-mail-cím" note="Ha módosítanád, írj nekünk.">
          <input className="field cursor-not-allowed opacity-70" type="email" value={user.email} readOnly />
        </Field>
        {google && <p className="-mt-2 text-sm text-muted">{google}</p>}
        <TextField
          label="Telefonszám"
          type="tel"
          name="phone"
          required={false}
          autoComplete="tel"
          value={value('phone')}
        />
      </div>
      <Submit>Mentés</Submit>
    </form>
  );
}

/** The billing details for invoices (the checkout fills them in the first time). */
export function BillingForm({ billing }: { billing: Billing }) {
  const [state, action] = useActionState(updateBilling, initial);
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <h2 className="font-display text-[32px] leading-none lg:text-[40px]">Számlázási adatok</h2>
      <p className="text-[15px] text-ink2">Ezek kerülnek a számláidra. Az eddig kiállított számlák nem változnak.</p>
      <Notice {...state} />
      <BillingFields value={(key) => v(state, key === 'name' ? 'billingName' : key) ?? billing[key]} />
      <Submit>Mentés</Submit>
    </form>
  );
}
