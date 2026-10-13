'use client';

/**
 * "Jelentkezem": a button that opens the sign-up form (Nyitott Műhely date, beginner course) or the
 * professional application form, in the site's dialog. Logged-in people see their name and sign
 * up with one click; guests give name, e-mail and phone (an account is made for them).
 */
import Link from 'next/link';
import { type ReactNode, useActionState, useEffect, useId, useState } from 'react';
import { useFormStatus } from 'react-dom';

import Dialog from '@/components/Dialog';
import { ArrowRight } from '@/components/icons';
import { type SignUpState, signUpAction, whoAmI } from '@/lib/applications/actions';
import { MIN_MOTIVATION } from '@/lib/applications/rules';

type Kind = 'workshop' | 'beginner' | 'professional';
type Me = Awaited<ReturnType<typeof whoAmI>>;

export type SignupTarget = {
  kind: Kind;
  /** The dialog's heading, e.g. "Nyitott Műhely — okt. 17., szombat". */
  title: string;
  /** Under the heading: time, place… */
  details?: string[];
  /** Shown highlighted next to the details, e.g. "5000 Ft" or "45 000 Ft / hó". */
  price?: string;
  sessionId?: number;
  courseGroupId?: number;
  /** The open groups to choose from (a select when there are several). */
  groups?: { id: number; label: string }[];
};

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

const DONE: Record<Kind, string> = {
  workshop:
    'Köszönjük, megkaptuk a jelentkezésed! Visszaigazolást küldtünk e-mailben. A fizetés részleteit hamarosan e-mailben küldjük.',
  beginner:
    'Köszönjük, megkaptuk a jelentkezésed! Visszaigazolást küldtünk e-mailben. A fizetés részleteit hamarosan e-mailben küldjük.',
  professional:
    'Köszönjük a jelentkezésed! Visszaigazolást küldtünk e-mailben, és hamarosan jelentkezünk az interjú részleteivel.',
};

export default function SignupDialog({
  target,
  label,
  buttonClassName,
}: {
  target: SignupTarget;
  label: string;
  buttonClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  return (
    <>
      <button type="button" aria-haspopup="dialog" className={buttonClassName} onClick={() => setOpen(true)}>
        {label}
        <ArrowRight />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        className="m-auto w-[min(92vw,640px)] rounded-[22px] border-0 bg-paper p-0 text-ink shadow-[0_30px_60px_-20px_rgba(8,31,34,0.6)] backdrop:bg-night/60 backdrop:backdrop-blur-[2px]"
        closeClassName="bg-paper lg:right-4 lg:top-4"
      >
        {/* mounted while open: a fresh form (and fresh "who am I") every time */}
        {open && <SignupForm target={target} titleId={titleId} />}
      </Dialog>
    </>
  );
}

function SignupForm({ target, titleId }: { target: SignupTarget; titleId: string }) {
  const [state, action] = useActionState<SignUpState, FormData>(signUpAction, {});
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [motivation, setMotivation] = useState(state.values?.message ?? '');
  useEffect(() => {
    whoAmI().then(setMe, () => setMe(null));
  }, []);
  const v = (key: string) => state.values?.[key];
  const professional = target.kind === 'professional';

  return (
    <div className="flex max-h-[88vh] flex-col gap-5 overflow-y-auto px-6 pb-8 pt-6 lg:px-10 lg:pb-10 lg:pt-9">
      <div className="flex flex-col gap-1.5 pr-10">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">
          {professional ? 'Szakmai kurzus — jelentkezés' : 'Jelentkezés'}
        </span>
        <h2 id={titleId} className="font-display text-[30px] leading-tight lg:text-[36px]">
          {target.title}
        </h2>
        {target.details?.map((d) => (
          <p key={d} className="text-[15px] text-ink2">
            {d}
          </p>
        ))}
        {target.price && (
          <p className="mt-2 self-start rounded-2xl bg-sand px-4 py-2.5">
            <span className="mr-2 text-xs font-bold uppercase tracking-[0.14em] text-teal">Részvételi díj</span>
            <span className="font-display text-[26px] leading-none text-ink">{target.price}</span>
          </p>
        )}
      </div>

      {state.done ? (
        <div className="flex flex-col gap-4">
          <p
            role="status"
            className="rounded-xl bg-teal/10 px-4 py-3 text-[16px] font-semibold leading-relaxed text-teal"
          >
            {DONE[target.kind]}
          </p>
          <p className="text-[15px] leading-relaxed text-ink2">
            A jelentkezésed a fiókodban követheted:{' '}
            <Link href="/fiokom" className="link font-semibold text-ink">
              Fiókom
            </Link>
            {me ? '' : ' (a belépéshez szükséges linket az e-mailben küldtük)'}.
          </p>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-4 lg:gap-5">
          {state.error && (
            <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[15px] font-semibold text-rust-dark">
              {state.error}
            </p>
          )}
          <input type="hidden" name="kind" value={target.kind} />
          {target.sessionId && <input type="hidden" name="session" value={target.sessionId} />}
          {(target.courseGroupId ?? (target.groups?.length === 1 ? target.groups[0]?.id : undefined)) && (
            <input type="hidden" name="courseGroup" value={target.courseGroupId ?? target.groups?.[0]?.id} />
          )}

          {me === undefined ? (
            <p className="text-[15px] text-muted">Betöltés…</p>
          ) : me ? (
            <>
              <p className="rounded-2xl bg-sand px-4 py-3 text-[15px] leading-relaxed text-ink2">
                Bejelentkezve: <strong className="font-semibold text-ink">{me.name}</strong> ({me.email})
              </p>
              <label className="field-label">
                Telefonszám *
                <input
                  className="field"
                  type="tel"
                  name="phone"
                  required
                  autoComplete="tel"
                  defaultValue={v('phone') ?? me.phone}
                />
              </label>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  Vezetéknév *
                  <input
                    className="field"
                    name="lastName"
                    required
                    autoComplete="family-name"
                    defaultValue={v('lastName')}
                  />
                </label>
                <label className="field-label">
                  Keresztnév *
                  <input
                    className="field"
                    name="firstName"
                    required
                    autoComplete="given-name"
                    defaultValue={v('firstName')}
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
                    defaultValue={v('email')}
                  />
                </label>
                <label className="field-label">
                  Telefonszám *
                  <input
                    className="field"
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    defaultValue={v('phone')}
                  />
                </label>
              </div>
            </>
          )}

          {!target.courseGroupId && target.groups && target.groups.length > 1 && (
            <label className="field-label">
              Melyik csoportba jelentkezel? *
              <select className="field" name="courseGroup" required defaultValue={v('courseGroup') ?? ''}>
                <option value="" disabled>
                  Válassz…
                </option>
                {target.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {professional && (
            <label className="field-label">
              Motiváció és tapasztalat *
              <span className="font-normal text-muted">
                Miért szeretnél szakmai kurzusra jönni, és mi a színházi (vagy más színpadi) tapasztalatod?
              </span>
              <textarea
                className="field min-h-[160px]"
                name="message"
                required
                minLength={MIN_MOTIVATION}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
              />
              <span
                className={`text-[13px] font-normal ${motivation.trim().length >= MIN_MOTIVATION ? 'text-teal' : 'text-muted'}`}
              >
                {motivation.trim().length} / legalább {MIN_MOTIVATION} karakter
              </span>
            </label>
          )}

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
          {me !== undefined && <Submit>{professional ? 'Jelentkezés elküldése' : 'Jelentkezem'}</Submit>}
          {!me && me !== undefined && (
            <p className="text-[14px] leading-relaxed text-muted">
              Van már fiókod?{' '}
              <Link href="/belepes" className="link font-semibold text-ink">
                Lépj be
              </Link>
              , és egy kattintással jelentkezhetsz. Ha nincs, a jelentkezéssel létrehozzuk.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
