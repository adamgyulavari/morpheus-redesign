'use client';

/**
 * /admin/szamlazas: pick a month, review who is due (szakmai havidíj, kezdő részletek), untick or
 * change an amount, then "Számlák kiállítása" (to pay by transfer; Számlázz.hu e-mails them).
 * Below: the transfer invoices not yet paid, with "Befizetve".
 */
import { useCallback, useEffect, useState, useTransition } from 'react';

import s from '@/components/rooms/calendar.module.css';
import { formatHuf } from '@/lib/format';
import { billingRunData, issueRunAction, markPaidAction } from '@/lib/invoicing/admin-actions';

type Data = NonNullable<Awaited<ReturnType<typeof billingRunData>>>;
type Line = Data['lines'][number];

const thisMonth = () =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit' }).format(
    new Date(),
  );
const right = { textAlign: 'right' as const, whiteSpace: 'nowrap' as const };
const MODE: Record<string, string> = {
  off: 'Kikapcsolva — a számlák csak piszkozatként készülnek, nem mennek ki',
  test: 'Teszt fiók — teszt számlák',
  live: 'Éles számlázás',
};

export default function AdminBillingRun() {
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState<Data | null>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [pending, start] = useTransition();

  const load = useCallback(
    (m: string) =>
      billingRunData(m).then((d) => {
        setData(d);
        // everything due and issuable is ticked; amounts start at the suggested ones
        setPicked(Object.fromEntries((d?.lines ?? []).map((l) => [l.key, !l.done && !l.problem])));
        setAmounts(Object.fromEntries((d?.lines ?? []).map((l) => [l.key, l.amount])));
      }),
    [],
  );
  useEffect(() => {
    load(month);
  }, [load, month]);

  if (!data) return <p className={s.muted}>Betöltés…</p>;
  const issuable = data.lines.filter((l) => !l.done && !l.problem);
  const chosen = issuable.filter((l) => picked[l.key]);
  const total = chosen.reduce((sum, l) => sum + (amounts[l.key] ?? 0), 0);

  const issue = () =>
    start(async () => {
      const r = await issueRunAction(
        month,
        chosen.map((l) => ({ key: l.key, amount: amounts[l.key] ?? l.amount })),
      );
      if (!r) return setToast({ text: 'Ehhez munkatársi jogosultság kell.', error: true });
      setResults(Object.fromEntries(r.map((x) => [x.key, x])));
      const failed = r.filter((x) => !x.ok).length;
      setToast(
        failed
          ? { text: `${r.length - failed} számla kész, ${failed} nem sikerült (lásd a sorokat).`, error: true }
          : { text: `${r.length} számla kész.` },
      );
      await load(month);
    });
  const paid = (id: number) =>
    start(async () => {
      const r = await markPaidAction(id);
      setToast(r.ok ? { text: 'Befizetve.' } : { text: r.reason, error: true });
      await load(month);
    });

  const rows = (kind: Line['kind']) => data.lines.filter((l) => l.kind === kind);
  const table = (lines: Line[]) => (
    <table className={s.table}>
      <thead>
        <tr>
          <th />
          <th>Név</th>
          <th>Tétel</th>
          <th style={right}>Összeg</th>
          <th>Állapot</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => {
          const res = results[l.key];
          return (
            <tr key={l.key}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`${l.name}: kiállítás`}
                  disabled={Boolean(l.done || l.problem)}
                  checked={Boolean(picked[l.key])}
                  onChange={(e) => setPicked((p) => ({ ...p, [l.key]: e.target.checked }))}
                />
              </td>
              <td>
                <a href={`/admin/collections/users/${l.userId}`}>{l.name}</a>
                <div className={s.muted}>{l.email}</div>
              </td>
              <td>{l.label}</td>
              <td style={right}>
                {l.done ? (
                  formatHuf(l.amount)
                ) : (
                  <span className={s.field}>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      style={{ width: 110, textAlign: 'right' }}
                      aria-label={`${l.name}: összeg`}
                      value={amounts[l.key] ?? l.amount}
                      onChange={(e) => setAmounts((a) => ({ ...a, [l.key]: Number(e.target.value) }))}
                    />
                  </span>
                )}
              </td>
              <td>
                {l.done ? (
                  <span className={s.muted}>
                    {l.done.status === 'draft'
                      ? 'Piszkozat'
                      : l.done.status === 'sending'
                        ? 'Küldés alatt'
                        : 'Kiállítva'}
                    {l.done.number ? ` · ${l.done.number}` : ''}
                  </span>
                ) : l.problem ? (
                  <span className={s.error}>{l.problem}</span>
                ) : res && !res.ok ? (
                  <span className={s.error}>{res.message}</span>
                ) : (
                  <span className={s.muted}>Esedékes</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    // the admin palette (its variables) for the shared buttons, fields and tables
    <div
      className={s.admin}
      style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, color: 'var(--cal-text)' }}
    >
      <div className={s.row} style={{ gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label className={s.field}>
          Hónap
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
        <span className={s.muted}>Számlázás: {MODE[data.mode] ?? data.mode}</span>
      </div>
      {toast && (
        <p className={toast.error ? s.error : s.notice} role="status">
          {toast.text}
        </p>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Szakmai havidíj ({rows('monthly').length})</h2>
        <p className={s.muted} style={{ margin: 0 }}>
          A hónapban futó szakmai csoportok hallgatói, a csoport havidíjával (Csoportok → Havidíj).
        </p>
        {rows('monthly').length ? (
          table(rows('monthly'))
        ) : (
          <p className={s.muted}>Nincs havidíjas csoport ebben a hónapban.</p>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Kezdő részletek ({rows('instalment').length})</h2>
        <p className={s.muted} style={{ margin: 0 }}>
          A részletfizetést választók következő részletei: a 2. a kurzus kezdete után egy hónappal, a 3. kettővel
          esedékes.
        </p>
        {rows('instalment').length ? table(rows('instalment')) : <p className={s.muted}>Nincs esedékes részlet.</p>}
      </section>

      <div className={s.row} style={{ gap: 12, alignItems: 'center' }}>
        <button type="button" className={`${s.btn} ${s.primary}`} disabled={pending || !chosen.length} onClick={issue}>
          {pending ? 'Egy pillanat…' : `Számlák kiállítása (${chosen.length} db, ${formatHuf(total)})`}
        </button>
        <span className={s.muted}>Átutalással fizetendő számlák; a Számlázz.hu e-mailben küldi ki őket.</span>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Befizetésre vár ({data.open.length})</h2>
        {data.open.length === 0 ? (
          <p className={s.muted}>Minden átutalásos számla rendezve.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Számla</th>
                <th>Név</th>
                <th>Tétel</th>
                <th style={right}>Összeg</th>
                <th>Határidő</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.open.map((o) => (
                <tr key={o.id}>
                  <td>
                    <a href={`/admin/collections/invoices/${o.id}`}>{o.number ?? 'piszkozat'}</a>
                  </td>
                  <td>{o.name}</td>
                  <td>{o.label}</td>
                  <td style={right}>{formatHuf(o.gross)}</td>
                  <td className={o.overdue ? s.error : undefined}>{o.dueDate ?? '—'}</td>
                  <td style={right}>
                    <button type="button" className={s.btn} disabled={pending} onClick={() => paid(o.id)}>
                      Befizetve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
