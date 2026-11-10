'use client';

/**
 * Above the Előadások (show dates) list: each upcoming show booked on the site with its door list
 * (bought, free and complimentary tickets, who is in), and Tiszteletjegy — free tickets by e-mail.
 */
import { type FormEvent, useCallback, useEffect, useState, useTransition } from 'react';

import { giveComplimentaryAction, showBookingsData } from '@/lib/applications/admin-actions';
import s from './admin.module.css';

type Show = NonNullable<Awaited<ReturnType<typeof showBookingsData>>>[number];
type Result = { ok: boolean; reason?: string; message?: string };
type Act = (fn: () => Promise<Result>) => Promise<boolean>;

export function ShowBookingsPanel() {
  const [shows, setShows] = useState<Show[] | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();

  const load = useCallback(() => showBookingsData().then(setShows), []);
  useEffect(() => {
    load();
  }, [load]);

  /** Runs an action, says how it went, reloads; true when it worked. */
  const act: Act = (fn) =>
    new Promise((resolve) =>
      start(async () => {
        const result = await fn();
        setToast(
          result.ok ? { text: result.message ?? 'Kész.' } : { text: result.reason ?? 'Hiba történt.', error: true },
        );
        await load();
        resolve(result.ok);
      }),
    );

  if (!shows?.length) return null;
  return (
    <section className={s.admin} style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '0 0 24px' }}>
      <h2 style={{ margin: 0 }}>Jegyek (saját foglalás)</h2>
      {toast && (
        <p className={toast.error ? s.error : s.notice} role="status">
          {toast.text}
        </p>
      )}
      {shows.map((show) => (
        <ShowBookings key={show.id} show={show} busy={pending} act={act} />
      ))}
    </section>
  );
}

const SHOW_STATE = {
  free: 'Ingyenes',
  paid: 'Fizetve',
  waiting: 'Fizetésre vár',
  complimentary: 'Tiszteletjegy',
} as const;

/** One show booked on the site: its seats, then who booked how many (the door list), and Tiszteletjegy. */
function ShowBookings({ show, busy, act }: { show: Show; busy: boolean; act: Act }) {
  const [giving, setGiving] = useState(false);
  const seatsLeft = Math.max(0, show.seats - show.taken);

  const give = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();
    const guest = {
      lastName: value('lastName'),
      firstName: value('firstName'),
      email: value('email'),
      phone: value('phone'),
    };
    if (await act(() => giveComplimentaryAction(show.id, guest, Number(value('seats'))))) setGiving(false);
  };

  return (
    <div className={s.panel} style={{ gap: 10, alignSelf: 'stretch' }}>
      <div className={s.row} style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong>
          {show.title} — {show.when}
        </strong>
        <span className={s.muted}>
          {show.taken} / {show.seats} jegy{show.arrived ? ` · ${show.arrived} beengedve` : ''} ·{' '}
          {show.price ? `${show.price} Ft / jegy` : 'ingyenes'}
          {show.hidden && ' · elrejtve'}
        </span>
      </div>
      {show.bookings.length === 0 ? (
        <p className={s.muted}>Még nincs foglalás.</p>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th>Név</th>
              <th>Elérhetőség</th>
              <th>Jegy</th>
              <th>Állapot</th>
            </tr>
          </thead>
          <tbody>
            {show.bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <a href={`/admin/collections/applications/${b.id}`}>{b.name}</a>
                </td>
                <td>
                  {b.email}
                  <div className={s.muted}>{b.phone}</div>
                </td>
                <td>
                  {b.seats}
                  {b.used > 0 && <div className={s.muted}>{b.used} beengedve</div>}
                </td>
                <td>{SHOW_STATE[b.state]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className={s.row}>
        <button
          type="button"
          className={s.btn}
          aria-pressed={giving}
          disabled={seatsLeft === 0}
          onClick={() => setGiving((open) => !open)}
        >
          Tiszteletjegy
        </button>
        {seatsLeft === 0 && <span className={s.muted}>Nincs szabad hely.</span>}
      </div>
      {giving && (
        <form className={s.form} onSubmit={give}>
          <div className={s.row}>
            <label className={s.field}>
              Vezetéknév
              <input name="lastName" required />
            </label>
            <label className={s.field}>
              Keresztnév
              <input name="firstName" required />
            </label>
            <label className={s.field}>
              E-mail
              <input name="email" type="email" required />
            </label>
            <label className={s.field}>
              Telefon (nem kötelező)
              <input name="phone" />
            </label>
            <label className={s.field}>
              Jegyek
              <input name="seats" type="number" min={1} max={seatsLeft} defaultValue={1} required />
            </label>
          </div>
          <p className={s.muted} style={{ margin: 0 }}>
            A jegyek a férőhelyből vesznek el ({seatsLeft} szabad), és QR-kóddal e-mailben mennek ki, belépési linkkel.
            Ha nincs még fiókja, létrehozzuk.
          </p>
          <div className={s.row}>
            <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy}>
              Kiadás és küldés
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
