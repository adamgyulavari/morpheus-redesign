'use client';

/**
 * The account forms. Each posts to a Server Action (lib/account-actions.ts) and shows its answer;
 * the fields keep what was typed when the action returns an error.
 */
import Link from 'next/link';
import { useActionState, useState } from 'react';

import BillingFields from '@/components/forms/BillingFields';
import { Field, RequiredMarks, TextField } from '@/components/forms/Field';
import Honeypot from '@/components/forms/Honeypot';
import Notice from '@/components/forms/Notice';
import { NameFields, PrivacyCheckbox } from '@/components/forms/PersonFields';
import Submit from '@/components/forms/Submit';
import { tagged } from '@/components/tagged';
import { useUi } from '@/components/UiStrings';
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
import { fill } from '@/lib/format';
import type { Billing } from '@/lib/payments/billing';

const initial: FormState = {};

const v = (state: FormState, key: string) => state.values?.[key];

const MIN_PASSWORD = 8;
const heading = 'font-display text-[32px] leading-none lg:text-[40px]';

// ── /belepes ────────────────────────────────────────────────────────────────

/** Password login, with "send me a login link" (+ the code from that e-mail) as the alternative. */
export function LoginForms({ returnTo, info }: { returnTo: string; info?: string }) {
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [loginState, loginAction] = useActionState(login, initial);
  const [linkState, linkAction] = useActionState(sendMagicLink, initial);
  const [codeState, codeAction] = useActionState(loginWithCode, initial);
  const { login: t, forms } = useUi();

  if (mode === 'link' && linkState.done) {
    // the link was sent: it can be opened on any device; here, the code from the same e-mail works
    return (
      <form action={codeAction} className="flex flex-col gap-4 lg:gap-5">
        <h2 className={heading}>{t.sentHeading}</h2>
        <Notice message={linkState.message} />
        <p className="text-[15px] leading-relaxed text-ink2">{t.sentIntro}</p>
        <Notice error={codeState.error} />
        <input type="hidden" name="email" value={linkState.values?.email ?? ''} />
        <input type="hidden" name="vissza" value={returnTo} />
        <TextField
          label={t.code}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          placeholder="123 456"
          className="max-w-[220px] text-center text-2xl font-semibold tracking-[0.3em] placeholder:font-normal placeholder:text-muted/40"
        />
        <Submit>{t.codeSubmit}</Submit>
        <ToPassword onClick={() => setMode('password')} />
      </form>
    );
  }

  if (mode === 'link') {
    return (
      <form action={linkAction} className="flex flex-col gap-4 lg:gap-5">
        <h2 className={heading}>{t.linkHeading}</h2>
        <p className="text-[15px] leading-relaxed text-ink2">{t.linkIntro}</p>
        <Notice {...linkState} />
        <TextField
          label={forms.email}
          type="email"
          name="email"
          autoComplete="email"
          value={v(linkState, 'email') ?? v(loginState, 'email')}
        />
        <Submit>{t.sendLink}</Submit>
        <ToPassword onClick={() => setMode('password')} />
      </form>
    );
  }

  return (
    <form action={loginAction} className="flex flex-col gap-4 lg:gap-5">
      <h2 className={heading}>{t.passwordHeading}</h2>
      <Notice error={loginState.error} message={loginState.message ?? info} />
      <input type="hidden" name="vissza" value={returnTo} />
      <TextField label={forms.email} type="email" name="email" autoComplete="email" value={v(loginState, 'email')} />
      <TextField label={forms.password} type="password" name="password" autoComplete="current-password" />
      <Submit>{t.submit}</Submit>
      <div className="flex flex-col gap-2 text-[15px] sm:flex-row sm:gap-6">
        <button type="button" className="link self-start font-semibold" onClick={() => setMode('link')}>
          {t.sendLink}
        </button>
        <Link href="/elfelejtett-jelszo" className="link self-start font-semibold">
          {t.forgot}
        </Link>
      </div>
    </form>
  );
}

function ToPassword({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="link self-start text-[15px] font-semibold" onClick={onClick}>
      {useUi().login.toPassword}
    </button>
  );
}

/** /belepes/link: whose login it is, and the button that uses up the link. */
export function MagicLinkConfirm({ token, email, next }: { token: string; email: string; next?: string }) {
  const [state, action] = useActionState(confirmMagicLink, initial);
  const t = useUi().login;
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <Notice {...state} />
      <p className="text-[17px] leading-relaxed text-ink2">
        {tagged(fill(t.confirmAs, { email }), {
          b: (chunk) => <strong className="font-semibold text-ink">{chunk}</strong>,
        })}
      </p>
      <input type="hidden" name="token" value={token} />
      {next && <input type="hidden" name="next" value={next} />}
      <Submit>{t.submit}</Submit>
      <p className="text-sm text-muted">{t.notYou}</p>
    </form>
  );
}

// ── /regisztracio ───────────────────────────────────────────────────────────

export function RegisterForm() {
  const [state, action] = useActionState(register, initial);
  const { register: t, forms } = useUi();
  if (state.done) {
    return (
      <div className="flex flex-col gap-4">
        <Notice {...state} />
        <p className="text-[15px] text-ink2">{t.notArrived}</p>
      </div>
    );
  }
  return (
    <RequiredMarks>
      <form action={action} className="flex flex-col gap-4 lg:gap-5">
        <p className="text-sm text-muted">{forms.required}</p>
        <Notice {...state} />
        <NameFields value={(key) => v(state, key)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={forms.email} type="email" name="email" autoComplete="email" value={v(state, 'email')} />
          <TextField
            label={forms.phone}
            type="tel"
            name="phone"
            required={false}
            autoComplete="tel"
            value={v(state, 'phone')}
          />
        </div>
        <TextField
          label={forms.password}
          hint={fill(t.passwordHint, { min: MIN_PASSWORD })}
          type="password"
          name="password"
          minLength={MIN_PASSWORD}
          autoComplete="new-password"
        />
        <Honeypot />
        <PrivacyCheckbox />
        <Submit>{t.submit}</Submit>
        <p className="text-[15px] text-ink2">
          {tagged(t.haveAccount, {
            link: (chunk) => (
              <Link href="/belepes" className="link font-semibold text-ink">
                {chunk}
              </Link>
            ),
          })}
        </p>
      </form>
    </RequiredMarks>
  );
}

// ── /elfelejtett-jelszo, /jelszo-visszaallitas ──────────────────────────────

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPassword, initial);
  const { password: t, forms } = useUi();
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <Notice {...state} />
      {!state.done && (
        <>
          <TextField label={forms.email} type="email" name="email" autoComplete="email" value={v(state, 'email')} />
          <Submit>{t.send}</Submit>
        </>
      )}
      <Link href="/belepes" className="link self-start text-[15px] font-semibold">
        {t.back}
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initial);
  const ui = useUi();
  const t = ui.password;
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <Notice {...state} />
      <input type="hidden" name="token" value={token} />
      <TextField
        label={t.new}
        hint={fill(ui.register.passwordHint, { min: MIN_PASSWORD })}
        type="password"
        name="password"
        minLength={MIN_PASSWORD}
        autoComplete="new-password"
      />
      <TextField
        label={t.confirm}
        type="password"
        name="confirm"
        minLength={MIN_PASSWORD}
        autoComplete="new-password"
      />
      <Submit>{t.submit}</Submit>
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
  const { profile: t, forms, common } = useUi();
  const value = (key: string) => v(state, key) ?? user[key as 'firstName' | 'lastName' | 'phone'] ?? '';
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <h2 className={heading}>{t.title}</h2>
      <Notice {...state} />
      <NameFields value={value} />
      <div className="grid gap-4">
        <Field label={forms.email} note={t.emailNote}>
          <input className="field cursor-not-allowed opacity-70" type="email" value={user.email} readOnly />
        </Field>
        {google && <p className="-mt-2 text-sm text-muted">{google}</p>}
        <TextField
          label={forms.phone}
          type="tel"
          name="phone"
          required={false}
          autoComplete="tel"
          value={value('phone')}
        />
      </div>
      <Submit>{common.save}</Submit>
    </form>
  );
}

/** The billing details for invoices (the checkout fills them in the first time). */
export function BillingForm({ billing }: { billing: Billing }) {
  const [state, action] = useActionState(updateBilling, initial);
  const { profile: t, common } = useUi();
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <h2 className={heading}>{t.billing}</h2>
      <p className="text-[15px] text-ink2">{t.billingIntro}</p>
      <Notice {...state} />
      <BillingFields value={(key) => v(state, key === 'name' ? 'billingName' : key) ?? billing[key]} />
      <Submit>{common.save}</Submit>
    </form>
  );
}
