'use client';

/**
 * /admin/jegyek/<show id>: one show booked on the site — who has how many tickets (bought, free,
 * tiszteletjegy), each ticket linking to its page (/jegy/<code>, where staff let it in), and
 * Tiszteletjegy in the side panel. The admin's edit form of a booking is behind its "…" menu.
 */
import { type FormEvent, useCallback, useEffect, useState, useTransition } from 'react';

import { giveComplimentaryAction, showTicketsData } from '@/lib/applications/admin-actions';
import s from './admin.module.css';

type Show = NonNullable<Awaited<ReturnType<typeof showTicketsData>>>;
type Booking = Show['bookings'][number];

const STATE: Record<Booking['state'], string> = {
  free: 'Ingyenes',
  paid: 'Fizetve',
  waiting: 'Fizetésre vár',
  complimentary: 'Tiszteletjegy',
};

export default function ShowTickets({ showId }: { showId: number }) {
  const [show, setShow] = useState<Show | null | undefined>(undefined);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();

  const load = useCallback(() => showTicketsData(showId).then(setShow), [showId]);
  useEffect(() => {
    load();
  }, [load]);

  if (show === undefined) return <p className={s.muted}>Betöltés…</p>;
  if (show === null) return <p className={s.muted}>Ez az előadás nem a weboldalon foglalható.</p>;
  const seatsLeft = Math.max(0, show.seats - show.taken);

  const give = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = new FormData(form);
    const value = (key: string) => String(fields.get(key) ?? '').trim();
    const guest = {
      lastName: value('lastName'),
      firstName: value('firstName'),
      email: value('email'),
      phone: value('phone'),
    };
    start(async () => {
      const result = await giveComplimentaryAction(show.id, guest, Number(value('seats')));
      setToast(result.ok ? { text: result.message ?? 'Kész.' } : { text: result.reason, error: true });
      if (result.ok) form.reset();
      await load();
    });
  };

  return (
    <div className={s.admin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p className={s.muted} style={{ margin: 0 }}>
        {show.when} · {show.place} · {show.price ? `${show.price} Ft / jegy` : 'ingyenes'}
        {show.hidden && ' · elrejtve'} · <a href={`/admin/collections/shows/${show.id}`}>az előadás adatai</a>
      </p>
      {toast && (
        <p className={toast.error ? s.error : s.notice} role="status">
          {toast.text}
        </p>
      )}
      <div className={s.layout}>
        <div className={s.panel}>
          <strong>
            {show.taken} / {show.seats} jegy{show.arrived ? ` · ${show.arrived} beengedve` : ''}
          </strong>
          {show.bookings.length === 0 ? (
            <p className={s.muted}>Még nincs foglalás.</p>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Név</th>
                  <th>Elérhetőség</th>
                  <th>Jegyek</th>
                  <th>Állapot</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {show.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.name}</td>
                    <td>
                      {booking.email}
                      <div className={s.muted}>{booking.phone}</div>
                    </td>
                    <td>
                      {booking.tickets.length
                        ? booking.tickets.map((ticket, index) => (
                            <a key={ticket.href} href={ticket.href} style={{ marginRight: 8 }}>
                              {index + 1}. jegy{ticket.used ? ' ✓' : ''}
                            </a>
                          ))
                        : `${booking.seats} hely, jegykód nélkül`}
                    </td>
                    <td>{STATE[booking.state]}</td>
                    <td style={{ textAlign: 'right' }}>
                      <details>
                        <summary aria-label={`További: ${booking.name}`} style={{ cursor: 'pointer' }}>
                          …
                        </summary>
                        <div className={s.muted} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <a href={`/admin/collections/applications/${booking.id}`}>Szerkesztés (admin űrlap)</a>
                          {booking.orderId && <a href={`/admin/collections/orders/${booking.orderId}`}>Rendelés</a>}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className={s.muted} style={{ margin: 0 }}>
            A jegyre kattintva a jegy oldala nyílik meg: ott engeded be a bejáratnál (✓: már bent van).
          </p>
        </div>

        <div className={s.side}>
          <form className={`${s.panel} ${s.form}`} onSubmit={give}>
            <h2 className={s.panelTitle}>Tiszteletjegy</h2>
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
            <p className={s.muted} style={{ margin: 0 }}>
              {seatsLeft} szabad hely. A jegyek QR-kóddal, belépési linkkel mennek ki e-mailben; ha nincs még fiókja,
              létrehozzuk.
            </p>
            <button
              type="submit"
              className={`${s.btn} ${s.primary}`}
              disabled={pending || seatsLeft === 0 || show.started}
            >
              Kiadás és küldés
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
