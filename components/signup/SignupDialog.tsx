'use client';

/**
 * "Jelentkezem": a button that opens the sign-up form (Nyitott Műhely date, beginner course), the
 * professional application form or a free show's booking (how many seats), in the site's dialog. Logged-in people see their name and sign
 * up with one click; guests give name, e-mail and phone (an account is made for them).
 */
import Link from 'next/link';
import { useActionState, useEffect, useId, useState } from 'react';

import Dialog from '@/components/Dialog';
import Checkbox from '@/components/forms/Checkbox';
import CountOptions from '@/components/forms/CountOptions';
import { Field, RequiredMarks, TextField } from '@/components/forms/Field';
import Honeypot from '@/components/forms/Honeypot';
import Notice from '@/components/forms/Notice';
import Submit from '@/components/forms/Submit';
import { ArrowRight } from '@/components/icons';
import { useUi } from '@/components/UiStrings';
import { bookShowAction, type SignUpState, signUpAction, whoAmI } from '@/lib/applications/actions';
import { MIN_MOTIVATION } from '@/lib/applications/rules';

type Kind = 'workshop' | 'beginner' | 'professional' | 'show';
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
  /** The open groups to choose from (a select when there are several, or with `noGroupLabel`). */
  groups?: { id: number; label: string }[];
  /** The course: what a group-less application is for. */
  courseId?: number;
  /** The course takes applications without a group: this option in the select ("none"). */
  noGroupLabel?: string;
  /** A free show: its booking link's code, and the most seats one may book. */
  showCode?: string;
  maxSeats?: number;
};

const DONE: Record<Exclude<Kind, 'show'>, string> = {
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
  const show = target.kind === 'show';
  const texts = useUi();
  const ui = texts.showBooking;
  const [state, action] = useActionState<SignUpState, FormData>(show ? bookShowAction : signUpAction, {});
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
          {professional ? 'Szakmai kurzus — jelentkezés' : show ? texts.shows.registration : 'Jelentkezés'}
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
            {!show && (
              <span className="mr-2 text-xs font-bold uppercase tracking-[0.14em] text-teal">Részvételi díj</span>
            )}
            <span
              className={show ? 'text-[15px] font-semibold text-ink' : 'font-display text-[26px] leading-none text-ink'}
            >
              {target.price}
            </span>
          </p>
        )}
      </div>

      {state.done ? (
        <div className="flex flex-col gap-4">
          <p
            role="status"
            className="rounded-xl bg-teal/10 px-4 py-3 text-[16px] font-semibold leading-relaxed text-teal"
          >
            {target.kind === 'show' ? ui.done : DONE[target.kind]}
          </p>
          <p className="text-[15px] leading-relaxed text-ink2">
            {show ? `${ui.track} ` : 'A jelentkezésed a fiókodban követheted: '}
            <Link href="/fiokom" className="link font-semibold text-ink">
              Fiókom
            </Link>
            {me ? '' : ' (a belépéshez szükséges linket az e-mailben küldtük)'}.
          </p>
        </div>
      ) : (
        <RequiredMarks>
          <form action={action} className="flex flex-col gap-4 lg:gap-5">
            <Notice error={state.error} />
            <input type="hidden" name="kind" value={target.kind} />
            {target.sessionId && <input type="hidden" name="session" value={target.sessionId} />}
            {(target.courseGroupId ??
              (target.groups?.length === 1 && !target.noGroupLabel ? target.groups[0]?.id : undefined)) && (
              <input type="hidden" name="courseGroup" value={target.courseGroupId ?? target.groups?.[0]?.id} />
            )}
            {target.courseId && <input type="hidden" name="course" value={target.courseId} />}
            {target.showCode && <input type="hidden" name="eloadas" value={target.showCode} />}

            {me === undefined ? (
              <p className="text-[15px] text-muted">Betöltés…</p>
            ) : me ? (
              <>
                <p className="rounded-2xl bg-sand px-4 py-3 text-[15px] leading-relaxed text-ink2">
                  Bejelentkezve: <strong className="font-semibold text-ink">{me.name}</strong> ({me.email})
                </p>
                <TextField
                  label="Telefonszám"
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={v('phone') ?? me.phone}
                />
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Vezetéknév" name="lastName" autoComplete="family-name" value={v('lastName')} />
                  <TextField label="Keresztnév" name="firstName" autoComplete="given-name" value={v('firstName')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="E-mail-cím" type="email" name="email" autoComplete="email" value={v('email')} />
                  <TextField label="Telefonszám" type="tel" name="phone" autoComplete="tel" value={v('phone')} />
                </div>
              </>
            )}

            {!target.courseGroupId && target.groups && target.groups.length > (target.noGroupLabel ? 0 : 1) && (
              <Field label="Melyik csoportba jelentkezel?" required>
                <select className="field" name="courseGroup" required defaultValue={v('courseGroup') ?? ''}>
                  <option value="" disabled>
                    Válassz…
                  </option>
                  {target.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                  {target.noGroupLabel && <option value="none">{target.noGroupLabel}</option>}
                </select>
              </Field>
            )}
            {show && (
              <Field label={ui.seats} required>
                <select className="field max-w-[140px]" name="jegyek" required defaultValue={v('jegyek') ?? '1'}>
                  <CountOptions max={target.maxSeats ?? 1} />
                </select>
              </Field>
            )}
            {professional && (
              <Field
                label="Motiváció és tapasztalat"
                required
                note={
                  <span className={motivation.trim().length >= MIN_MOTIVATION ? 'text-teal' : undefined}>
                    {motivation.trim().length} / legalább {MIN_MOTIVATION} karakter
                  </span>
                }
              >
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
              </Field>
            )}

            <Honeypot />
            <Checkbox name="privacy">
              Elolvastam és elfogadom az{' '}
              <Link href="/adatkezelesi-tajekoztato/" className="link font-semibold text-ink" target="_blank">
                adatkezelési tájékoztatót
              </Link>
              .
            </Checkbox>
            {me !== undefined && (
              <Submit>{professional ? 'Jelentkezés elküldése' : show ? ui.submit : 'Jelentkezem'}</Submit>
            )}
            {!me && me !== undefined && (
              <p className="text-[14px] leading-relaxed text-muted">
                Van már fiókod?{' '}
                <Link href="/belepes" className="link font-semibold text-ink">
                  Lépj be
                </Link>
                {show ? ui.loginAfter : ', és egy kattintással jelentkezhetsz. Ha nincs, a jelentkezéssel létrehozzuk.'}
              </p>
            )}
          </form>
        </RequiredMarks>
      )}
    </div>
  );
}
