'use client';

/**
 * The account forms. Each posts to a Server Action (lib/account-actions.ts) and shows its answer;
 * the fields keep what was typed when the action returns an error.
 */
import Link from 'next/link';
import { type ReactNode, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { ArrowRight } from '@/components/icons';
import {
  confirmMagicLink,
  type FormState,
  forgotPassword,
  login,
  loginWithCode,
  register,
  resetPassword,
  sendMagicLink,
  updateProfile,
} from '@/lib/account-actions';

const initial: FormState = {};

function Submit({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-lg btn-primary self-stretch disabled:opacity-60 sm:self-start"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? 'Egy pillanat…' : children}
      {!pending && <ArrowRight />}
    </button>
  );
}

/** The action's answer: an error (alert) or a confirmation (status). */
export function Notice({ state, info }: { state?: FormState; info?: string }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[15px] font-semibold text-rust-dark">
        {state.error}
      </p>
    );
  }
  const text = state?.message ?? info;
  return text ? (
    <p role="status" className="rounded-xl bg-teal/10 px-4 py-3 text-[15px] font-semibold text-teal">
      {text}
    </p>
  ) : null;
}

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
        <Notice state={linkState} />
        <p className="text-[15px] leading-relaxed text-ink2">
          Kattints a levélben lévő gombra, vagy ha a levelet másik eszközön olvasod, írd be ide a benne lévő 6 jegyű
          kódot.
        </p>
        <Notice state={codeState.error ? codeState : undefined} />
        <input type="hidden" name="email" value={linkState.values?.email ?? ''} />
        <input type="hidden" name="vissza" value={returnTo} />
        <label className="field-label">
          Belépési kód
          <input
            className="field max-w-[220px] text-center text-2xl font-semibold tracking-[0.3em] placeholder:font-normal placeholder:text-muted/40"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            placeholder="123 456"
          />
        </label>
        <Submit>Belépés a kóddal</Submit>
        <button type="button" className="link self-start text-[15px] font-semibold" onClick={() => setMode('password')}>
          Inkább jelszóval lépek be
        </button>
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
        <Notice state={linkState} />
        <label className="field-label">
          E-mail-cím
          <input
            className="field"
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={v(linkState, 'email') ?? v(loginState, 'email')}
          />
        </label>
        <Submit>Belépési link küldése</Submit>
        <button type="button" className="link self-start text-[15px] font-semibold" onClick={() => setMode('password')}>
          Inkább jelszóval lépek be
        </button>
      </form>
    );
  }

  return (
    <form action={loginAction} className="flex flex-col gap-4 lg:gap-5">
      <h2 className="font-display text-[32px] leading-none lg:text-[40px]">Belépés jelszóval</h2>
      <Notice state={loginState} info={info} />
      <input type="hidden" name="vissza" value={returnTo} />
      <label className="field-label">
        E-mail-cím
        <input
          className="field"
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={v(loginState, 'email')}
        />
      </label>
      <label className="field-label">
        Jelszó
        <input className="field" type="password" name="password" required autoComplete="current-password" />
      </label>
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

/** /belepes/link: whose login it is, and the button that uses up the link. */
export function MagicLinkConfirm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState(confirmMagicLink, initial);
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <Notice state={state} />
      <p className="text-[17px] leading-relaxed text-ink2">
        Belépés ezzel a fiókkal: <strong className="font-semibold text-ink">{email}</strong>
      </p>
      <input type="hidden" name="token" value={token} />
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
        <Notice state={state} />
        <p className="text-[15px] text-ink2">Nem jött meg a levél? Nézd meg a spam mappát is, vagy írj nekünk.</p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <p className="text-sm text-muted">A csillaggal (*) jelölt mezők kitöltése kötelező.</p>
      <Notice state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          Vezetéknév *
          <input
            className="field"
            name="lastName"
            required
            autoComplete="family-name"
            defaultValue={v(state, 'lastName')}
          />
        </label>
        <label className="field-label">
          Keresztnév *
          <input
            className="field"
            name="firstName"
            required
            autoComplete="given-name"
            defaultValue={v(state, 'firstName')}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          E-mail-cím *
          <input
            className="field"
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={v(state, 'email')}
          />
        </label>
        <label className="field-label">
          Telefonszám
          <input className="field" type="tel" name="phone" autoComplete="tel" defaultValue={v(state, 'phone')} />
        </label>
      </div>
      <label className="field-label">
        Jelszó * <span className="font-normal text-muted">(legalább 8 karakter)</span>
        <input className="field" type="password" name="password" required minLength={8} autoComplete="new-password" />
      </label>
      {/* honeypot: hidden from people (and screen readers), filled in by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Weboldal
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-ink2">
        <input type="checkbox" name="privacy" required className="mt-1 h-5 w-5 shrink-0 accent-teal" />
        <span>
          Elolvastam és elfogadom az{' '}
          <Link href="/adatkezelesi-tajekoztato/" className="link font-semibold text-ink" target="_blank">
            adatkezelési tájékoztatót
          </Link>
          . *
        </span>
      </label>
      <Submit>Regisztrálok</Submit>
      <p className="text-[15px] text-ink2">
        Van már fiókod?{' '}
        <Link href="/belepes" className="link font-semibold text-ink">
          Belépés
        </Link>
      </p>
    </form>
  );
}

// ── /elfelejtett-jelszo, /jelszo-visszaallitas ──────────────────────────────

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPassword, initial);
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <Notice state={state} />
      {!state.done && (
        <>
          <label className="field-label">
            E-mail-cím
            <input
              className="field"
              type="email"
              name="email"
              required
              autoComplete="email"
              defaultValue={v(state, 'email')}
            />
          </label>
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
      <Notice state={state} />
      <input type="hidden" name="token" value={token} />
      <label className="field-label">
        Új jelszó <span className="font-normal text-muted">(legalább 8 karakter)</span>
        <input className="field" type="password" name="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="field-label">
        Új jelszó még egyszer
        <input className="field" type="password" name="confirm" required minLength={8} autoComplete="new-password" />
      </label>
      <Submit>Jelszó mentése</Submit>
    </form>
  );
}

// ── /fiokom ─────────────────────────────────────────────────────────────────

export function ProfileForm({
  user,
}: {
  user: { email: string; firstName: string; lastName: string; phone?: string | null };
}) {
  const [state, action] = useActionState(updateProfile, initial);
  const value = (key: 'firstName' | 'lastName' | 'phone') => v(state, key) ?? user[key] ?? '';
  return (
    <form action={action} className="flex flex-col gap-4 lg:gap-5">
      <h2 className="font-display text-[32px] leading-none lg:text-[40px]">Adataim</h2>
      <Notice state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          Vezetéknév
          <input
            className="field"
            name="lastName"
            required
            autoComplete="family-name"
            defaultValue={value('lastName')}
          />
        </label>
        <label className="field-label">
          Keresztnév
          <input
            className="field"
            name="firstName"
            required
            autoComplete="given-name"
            defaultValue={value('firstName')}
          />
        </label>
      </div>
      <div className="grid gap-4">
        <label className="field-label">
          E-mail-cím
          <input
            className="field cursor-not-allowed opacity-70"
            type="email"
            value={user.email}
            readOnly
            aria-describedby="email-note"
          />
          <span id="email-note" className="text-xs font-normal text-muted">
            Ha módosítanád, írj nekünk.
          </span>
        </label>
        <label className="field-label">
          Telefonszám
          <input className="field" type="tel" name="phone" autoComplete="tel" defaultValue={value('phone')} />
        </label>
      </div>
      <Submit>Mentés</Submit>
    </form>
  );
}
