'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import s from '@/components/rooms/calendar.module.css';
import { formatHuf } from '@/lib/format';
import { refundOrderAction } from '@/lib/payments/admin-actions';

/** The refund box: amount (default: all that is left), the reason, then a second click to confirm. */
export function OrderRefundForm({
  orderId,
  left,
  leftText,
  paidText,
}: {
  orderId: number;
  left: number;
  leftText: string;
  paidText: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(left);
  const [note, setNote] = useState('');
  const [sure, setSure] = useState(false);
  const [answer, setAnswer] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const valid = amount >= 1 && amount <= left && note.trim().length > 0;

  const refund = () =>
    start(async () => {
      const r = await refundOrderAction(orderId, amount, note);
      setSure(false);
      if (!r.ok) return setAnswer({ text: r.reason, error: true });
      setAnswer({
        text: `${formatHuf(r.amount)} visszatérítve.${r.full ? ' A számlát sztornóztuk.' : ' A számlát kézzel kell helyesbíteni a Számlázz.hu-ban.'}`,
      });
      router.refresh();
    });

  return (
    <section className={s.admin} style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '0 0 2rem' }}>
      <h3 style={{ margin: 0 }}>Visszatérítés</h3>
      <p className={s.muted} style={{ margin: 0 }}>
        A fizetési szolgáltatón keresztül, a kártyára. Fizetve: {paidText}; visszatéríthető: {leftText}. A jelentkezés
        nem változik — ha kell, mondd le a Jelentkezések oldalon.
      </p>
      <div className={s.row} style={{ gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label className={s.field} style={{ width: 160 }}>
          Összeg (Ft)
          <input
            type="number"
            min={1}
            max={left}
            value={amount}
            onChange={(e) => {
              setAmount(Math.round(Number(e.target.value)));
              setSure(false);
            }}
          />
        </label>
        <label className={s.field} style={{ flex: 1, minWidth: 240 }}>
          Ok (a naplóba)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="pl. elmaradt alkalom" />
        </label>
        {sure ? (
          <>
            <button type="button" className={`${s.btn} ${s.primary}`} disabled={pending || !valid} onClick={refund}>
              {pending ? 'Egy pillanat…' : `Igen, ${formatHuf(amount)} visszautalása`}
            </button>
            <button type="button" className={s.btn} disabled={pending} onClick={() => setSure(false)}>
              Mégse
            </button>
          </>
        ) : (
          <button type="button" className={s.btn} disabled={!valid} onClick={() => setSure(true)}>
            Visszatérítés…
          </button>
        )}
      </div>
      {answer && (
        <p className={answer.error ? s.error : s.notice} role="status" style={{ margin: 0 }}>
          {answer.text}
        </p>
      )}
    </section>
  );
}
