'use client';

/**
 * /admin/jelentkezesek: what staff act on.
 * - Nyitott Műhely: each upcoming date with its count and decision time; participants with
 *   "Fizetve" (record payment), cancel; add a participant; e-mail everyone registered.
 * - Kezdő: sign-ups not yet in their group — "Fizetve", "Felvétel" (into the group, may book rooms).
 * - Szakmai: applications under review — "Interjú", "Elutasítás" (no e-mail), "Felvétel és
 *   csoportba helyezés".
 */
import { type FormEvent, useCallback, useEffect, useState, useTransition } from 'react';

import s from '@/components/rooms/calendar.module.css';
import {
  addParticipantAction,
  admitAction,
  cancelParticipantAction,
  dashboardData,
  messageParticipantsAction,
  reviewAction,
  setPaidAction,
  setPaymentNoteAction,
} from '@/lib/applications/admin-actions';
import { APPLICATION_STATUSES, WORKSHOP_STATUSES } from '@/lib/applications/labels';

type Data = NonNullable<Awaited<ReturnType<typeof dashboardData>>>;
type App = Data['beginners'][number];
type Result = { ok: boolean; reason?: string; message?: string };

const date = (iso: string) =>
  new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', month: 'short', day: 'numeric' }).format(
    new Date(iso),
  );
const fieldset = { border: 0, padding: 0, margin: 0 } as const;

export default function AdminApplications() {
  const [data, setData] = useState<Data | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();

  const load = useCallback(() => dashboardData().then(setData), []);
  useEffect(() => {
    load();
  }, [load]);

  /** Runs an action, says how it went, reloads. */
  const act = (fn: () => Promise<Result>, ok?: string) =>
    start(async () => {
      const r = await fn();
      setToast(r.ok ? { text: r.message ?? ok ?? 'Kész.' } : { text: r.reason ?? 'Hiba történt.', error: true });
      await load();
    });

  if (!data) return <p className={s.muted}>Betöltés…</p>;
  return (
    <div className={s.admin} style={{ display: 'flex', flexDirection: 'column', gap: 28, color: 'var(--cal-text)' }}>
      {toast && (
        <p className={toast.error ? s.error : s.notice} role="status">
          {toast.text}
        </p>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Kezdő kurzus ({data.beginners.length})</h2>
        <p className={s.muted} style={{ margin: 0 }}>
          A „Felvétel” a csoport hallgatói közé teszi (teremfoglalási joggal), és üdvözlő levelet küld belépési linkkel.
        </p>
        {data.beginners.length === 0 ? (
          <p className={s.muted}>Nincs felvételre váró jelentkezés.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Név</th>
                <th>Elérhetőség</th>
                <th>Csoport</th>
                <th>Jelentkezett</th>
                <th>Fizetve</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.beginners.map((a) => (
                <tr key={a.id}>
                  <td>
                    <a href={`/admin/collections/applications/${a.id}`}>{a.name}</a>
                  </td>
                  <td>
                    {a.email}
                    <div className={s.muted}>{a.phone}</div>
                  </td>
                  <td>{a.group?.title}</td>
                  <td>{date(a.createdAt)}</td>
                  <td>
                    <Paid app={a} busy={pending} act={act} />
                  </td>
                  <td>
                    <Confirm
                      label="Felvétel"
                      confirm="Felveszed a csoportba?"
                      primary
                      busy={pending}
                      onConfirm={() => act(() => admitAction(a.id))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Szakmai kurzus ({data.professionals.length})</h2>
        <p className={s.muted} style={{ margin: 0 }}>
          Az „Elutasítás” nem küld e-mailt — azt személyesen írjuk meg. A felvétel a kiválasztott csoportba tesz, és
          üdvözlő levelet küld.
        </p>
        {data.professionals.length === 0 && <p className={s.muted}>Nincs elbírálásra váró jelentkezés.</p>}
        {data.professionals.map((a) => (
          <Professional key={a.id} app={a} groups={data.professionalGroups} busy={pending} act={act} />
        ))}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Nyitott Műhely</h2>
        {data.workshops.length === 0 && <p className={s.muted}>Nincs közelgő alkalom.</p>}
        {data.workshops.map((w) => (
          <Workshop key={w.id} w={w} busy={pending} act={act} />
        ))}
      </section>
    </div>
  );
}

type Act = (fn: () => Promise<Result>, ok?: string) => void;

/** "Fizetve" checkbox, with an optional note ("átutalta 10.12."). */
function Paid({ app, busy, act }: { app: App; busy: boolean; act: Act }) {
  const [note, setNote] = useState(app.paymentNote);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label className={s.check}>
        <input
          type="checkbox"
          checked={app.paidOffline}
          disabled={busy}
          onChange={(e) =>
            act(
              () => setPaidAction(app.id, e.target.checked),
              e.target.checked ? 'Fizetés rögzítve.' : 'Fizetés törölve.',
            )
          }
        />
        {app.paidOffline ? 'Fizetve' : 'Fizetés rögzítése'}
      </label>
      <input
        aria-label="Fizetés megjegyzés"
        placeholder="megjegyzés, pl. átutalta 10.12."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== app.paymentNote && act(() => setPaymentNoteAction(app.id, note), 'Megjegyzés mentve.')}
        style={{
          font: 'inherit',
          fontSize: 13,
          padding: '4px 6px',
          background: 'transparent',
          color: 'inherit',
          border: '1px solid var(--cal-line)',
          borderRadius: 6,
        }}
      />
    </div>
  );
}

/** A button that asks once more before acting. */
function Confirm({
  label,
  confirm,
  onConfirm,
  busy,
  primary,
  danger,
}: {
  label: string;
  confirm: string;
  onConfirm: () => void;
  busy: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const cls = `${s.btn} ${primary ? s.primary : ''} ${danger ? s.danger : ''}`;
  if (!asking)
    return (
      <button type="button" className={cls} disabled={busy} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  return (
    <span className={s.row} style={{ alignItems: 'center' }}>
      <span className={s.muted}>{confirm}</span>
      <button
        type="button"
        className={cls}
        disabled={busy}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Igen
      </button>
      <button type="button" className={s.btn} onClick={() => setAsking(false)}>
        Mégse
      </button>
    </span>
  );
}

function Professional({
  app,
  groups,
  busy,
  act,
}: {
  app: App;
  groups: Data['professionalGroups'];
  busy: boolean;
  act: Act;
}) {
  const [group, setGroup] = useState<number | ''>(app.group?.id ?? (groups.length === 1 ? (groups[0]?.id ?? '') : ''));
  return (
    <div className={s.panel} style={{ gap: 10, alignSelf: 'stretch' }}>
      <div className={s.row} style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong>
          <a href={`/admin/collections/applications/${app.id}`}>{app.name}</a>
        </strong>
        <span className={s.muted}>
          {APPLICATION_STATUSES[app.status]} · {date(app.createdAt)}
        </span>
      </div>
      <div className={s.muted}>
        {app.email} · {app.phone}
        {app.group && ` · jelentkezett ide: ${app.group.title}`}
      </div>
      <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{app.message}</p>
      <div className={s.row} style={{ alignItems: 'center' }}>
        {app.status === 'new' && (
          <button
            type="button"
            className={s.btn}
            disabled={busy}
            onClick={() => act(() => reviewAction(app.id, 'interview'))}
          >
            Interjú
          </button>
        )}
        <Confirm
          label="Elutasítás"
          confirm="Elutasítod? (E-mail nem megy.)"
          danger
          busy={busy}
          onConfirm={() => act(() => reviewAction(app.id, 'rejected'))}
        />
        <label className={s.field} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          Csoport
          <select value={group} onChange={(e) => setGroup(e.target.value ? Number(e.target.value) : '')}>
            <option value="">—</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <Confirm
          label="Felvétel és csoportba helyezés"
          confirm="Felveszed ebbe a csoportba?"
          primary
          busy={busy || !group}
          onConfirm={() => group && act(() => admitAction(app.id, group))}
        />
      </div>
    </div>
  );
}

function Workshop({ w, busy, act }: { w: Data['workshops'][number]; busy: boolean; act: Act }) {
  const [adding, setAdding] = useState(false);
  const [writing, setWriting] = useState(false);
  const status =
    w.status === 'cancelled'
      ? 'Elmarad'
      : w.status === 'confirmed'
        ? WORKSHOP_STATUSES.confirmed
        : 'Gyűjti a jelentkezőket';

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? '').trim();
    act(() =>
      addParticipantAction(w.id, {
        lastName: v('lastName'),
        firstName: v('firstName'),
        email: v('email'),
        phone: v('phone'),
      }),
    );
    setAdding(false);
  };
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    act(() => messageParticipantsAction(w.id, String(f.get('subject') ?? ''), String(f.get('message') ?? '')));
    setWriting(false);
  };

  return (
    <div className={s.panel} style={{ gap: 10, alignSelf: 'stretch' }}>
      <div className={s.row} style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong>
          <a href={`/admin/collections/sessions/${w.id}`}>{w.when}</a>
        </strong>
        <span className={w.status === 'cancelled' ? s.error : s.muted} style={{ padding: 0, background: 'none' }}>
          {status}
        </span>
      </div>
      <div className={s.muted}>
        {w.taken} jelentkező (minimum {w.min}
        {w.max ? `, maximum ${w.max}` : ''}) · döntés: {w.cutoff}
        {w.price ? ` · ${w.price}` : ''}
      </div>
      {w.participants.length > 0 && (
        <table className={s.table}>
          <thead>
            <tr>
              <th>Név</th>
              <th>Elérhetőség</th>
              <th>Állapot</th>
              <th>Fizetve</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {w.participants.map((p) => (
              <tr key={p.id} style={p.status === 'registered' ? undefined : { opacity: 0.55 }}>
                <td>
                  <a href={`/admin/collections/applications/${p.id}`}>{p.name}</a>
                </td>
                <td>
                  {p.email}
                  <div className={s.muted}>{p.phone}</div>
                </td>
                <td>{APPLICATION_STATUSES[p.status]}</td>
                <td>
                  {p.status === 'registered' ? <Paid app={p} busy={busy} act={act} /> : p.paidOffline ? 'Fizetve' : ''}
                </td>
                <td>
                  {p.status === 'registered' && (
                    <Confirm
                      label="Lemondás"
                      confirm="Lemondod? (E-mailt kap.)"
                      danger
                      busy={busy}
                      onConfirm={() => act(() => cancelParticipantAction(p.id))}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className={s.row}>
        <button type="button" className={s.btn} aria-pressed={adding} onClick={() => setAdding((v) => !v)}>
          Résztvevő hozzáadása
        </button>
        <button type="button" className={s.btn} aria-pressed={writing} onClick={() => setWriting((v) => !v)}>
          E-mail a résztvevőknek
        </button>
      </div>
      {adding && (
        <form className={s.form} onSubmit={add}>
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
              Telefon
              <input name="phone" required />
            </label>
          </div>
          <p className={s.muted} style={{ margin: 0 }}>
            Ha nincs még fiókja, létrehozzuk; visszaigazolást kap belépési linkkel.
          </p>
          <div className={s.row}>
            <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy}>
              Hozzáadás
            </button>
          </div>
        </form>
      )}
      {writing && (
        <form className={s.form} onSubmit={send}>
          <fieldset style={fieldset} className={s.field}>
            <label className={s.field}>
              Tárgy
              <input name="subject" placeholder={`Üzenet: Nyitott Műhely, ${w.when}`} />
            </label>
            <label className={s.field}>
              Üzenet
              <textarea name="message" rows={5} required />
            </label>
          </fieldset>
          <p className={s.muted} style={{ margin: 0 }}>
            A jelentkezett ({w.taken}) résztvevők kapják meg.
          </p>
          <div className={s.row}>
            <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy || w.taken === 0}>
              Küldés
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
