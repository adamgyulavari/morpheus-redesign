'use client';

/**
 * /admin/jelentkezesek: what staff act on. Every row has one "Kezelés" button: a dialog with the
 * payment fields and the possible decisions, saved by one button in one server call (payment
 * first, then the decision), so nothing races.
 * - Kezdő: Mentés / Mentés és felvétel (into the group — or, without one, a chosen group; may book
 *   rooms) / Elutasítás (archived).
 * - Szakmai: Interjú / Elutasítás (no e-mail) / Felvétel és csoportba helyezés.
 * - Nyitott Műhely: payment, Lemondás (an e-mail tells them); per date: add a participant, e-mail them.
 */
import { type FormEvent, type ReactNode, useCallback, useEffect, useId, useState, useTransition } from 'react';

import Dialog from '@/components/Dialog';
import {
  addParticipantAction,
  dashboardData,
  decideAction,
  messageParticipantsAction,
} from '@/lib/applications/admin-actions';
import { APPLICATION_STATUSES, WORKSHOP_STATUSES } from '@/lib/applications/labels';
import type { Decision } from '@/lib/applications/server';
import s from './admin.module.css';

type Data = NonNullable<Awaited<ReturnType<typeof dashboardData>>>;
type App = Data['beginners'][number];
type Kind = 'beginner' | 'professional' | 'workshop';
type Result = { ok: boolean; reason?: string; message?: string };
type Act = (fn: () => Promise<Result>) => Promise<boolean>;
type Manage = (app: App, kind: Kind, context: string) => ReactNode;

const date = (iso: string) =>
  new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', month: 'short', day: 'numeric' }).format(
    new Date(iso),
  );

export default function Applications() {
  const [data, setData] = useState<Data | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [open, setOpen] = useState<{ app: App; kind: Kind; context: string } | null>(null);
  const [pending, start] = useTransition();

  const load = useCallback(() => dashboardData().then(setData), []);
  useEffect(() => {
    load();
  }, [load]);

  /** Runs an action, says how it went, reloads; true when it worked. */
  const act: Act = (fn) =>
    new Promise((resolve) =>
      start(async () => {
        const r = await fn();
        setToast(r.ok ? { text: r.message ?? 'Kész.' } : { text: r.reason ?? 'Hiba történt.', error: true });
        await load();
        resolve(r.ok);
      }),
    );
  const manage: Manage = (app, kind, context) => (
    <button type="button" className={s.btn} onClick={() => setOpen({ app, kind, context })}>
      Kezelés
    </button>
  );

  if (!data) return <p className={s.muted}>Betöltés…</p>;
  return (
    <div className={s.admin} style={{ display: 'flex', flexDirection: 'column', gap: 28, color: 'var(--cal-text)' }}>
      {toast && (
        <p className={toast.error ? s.error : s.notice} role="status">
          {toast.text}
        </p>
      )}

      <Legend />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Kezdő kurzus ({data.beginners.length})</h2>
        <p className={s.muted} style={{ margin: 0 }}>
          A felvétel a csoport hallgatói közé tesz, és üdvözlő levelet küld belépési linkkel. Teremfoglalást a fiókján
          adhatsz.
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
                <th>Fizetés</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.beginners.map((a) => (
                <tr key={a.id}>
                  <td>{nameCell(a, 'beginner')}</td>
                  <td>
                    {a.email}
                    <div className={s.muted}>{a.phone}</div>
                  </td>
                  <td>{a.group?.title ?? <span className={s.muted}>{a.target}</span>}</td>
                  <td>{date(a.createdAt)}</td>
                  <td>
                    <PaidText app={a} />
                  </td>
                  <td style={right}>{manage(a, 'beginner', a.target)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Szakmai kurzus ({data.professionals.length})</h2>
        <p className={s.muted} style={{ margin: 0 }}>
          Az elutasítás nem küld e-mailt — azt személyesen írjuk meg. A felvétel a kiválasztott csoportba tesz, és
          üdvözlő levelet küld.
        </p>
        {data.professionals.length === 0 && <p className={s.muted}>Nincs elbírálásra váró jelentkezés.</p>}
        {data.professionals.map((a) => (
          <div key={a.id} className={s.panel} style={{ gap: 10, alignSelf: 'stretch' }}>
            <div className={s.row} style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>{nameCell(a, 'professional')}</strong>
              <span className={s.row} style={{ alignItems: 'center' }}>
                <span className={s.muted}>
                  {APPLICATION_STATUSES[a.status]} · {date(a.createdAt)}
                </span>
                {manage(a, 'professional', a.target)}
              </span>
            </div>
            <div className={s.muted}>
              {a.email} · {a.phone}
              {a.group && ` · jelentkezett ide: ${a.group.title}`}
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{a.message}</p>
          </div>
        ))}
      </section>

      {data.shows.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Előadások (saját foglalás)</h2>
          {data.shows.map((sh) => (
            <ShowBookings key={sh.id} show={sh} />
          ))}
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Nyitott Műhely</h2>
        {data.workshops.length === 0 && <p className={s.muted}>Nincs közelgő alkalom.</p>}
        {data.workshops.map((w) => (
          <Workshop key={w.id} w={w} busy={pending} act={act} manage={manage} />
        ))}
      </section>

      {open && (
        <DecisionDialog
          key={open.app.id}
          {...open}
          groups={data.groups[open.kind === 'beginner' ? 'beginner' : 'professional']}
          busy={pending}
          onClose={() => setOpen(null)}
          onDecide={async (input) => {
            if (await act(() => decideAction(open.app.id, input))) setOpen(null);
          }}
        />
      )}
    </div>
  );
}

/** What the row needs: amber = something to do, teal = ready for the next step, grey = done. */
function stateOf(app: App, kind: Kind): { tone: 'todo' | 'ready' | 'done'; text: string } {
  if (kind === 'professional')
    return app.status === 'new'
      ? { tone: 'todo', text: 'Új jelentkezés — elbírálásra vár' }
      : { tone: 'ready', text: 'Interjú — döntésre vár' };
  if (!app.paidOffline && !app.paidOnline) return { tone: 'todo', text: 'A fizetés nincs rögzítve' };
  if (kind === 'beginner')
    return { tone: 'ready', text: app.group ? 'Fizetett — felvehető' : 'Fizetett — csoportba helyezhető' };
  return { tone: 'done', text: app.paidOnline ? 'Online fizetve' : 'Fizetve' };
}
const TONES = {
  todo: { bg: '#f9c86a', fg: '#0b3a3f', mark: '!' },
  ready: { bg: '#3fb8a8', fg: '#0b3a3f', mark: '→' },
  done: { bg: 'var(--cal-soft)', fg: 'var(--cal-muted)', mark: '✓' },
} as const;

function StateIcon({ app, kind }: { app: App; kind: Kind }) {
  const { tone, text } = stateOf(app, kind);
  const t = TONES[tone];
  return (
    <span
      title={text}
      aria-label={text}
      role="img"
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: 22,
        height: 22,
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        fontWeight: 800,
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      {t.mark}
    </span>
  );
}

function Legend() {
  return (
    <p className={s.muted} style={{ margin: 0, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      {(
        [
          ['todo', 'teendő (fizetés / elbírálás)'],
          ['ready', 'következő lépés (felvétel / döntés)'],
          ['done', 'rendben'],
        ] as const
      ).map(([tone, text]) => (
        <span key={tone} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: 18,
              height: 18,
              borderRadius: 999,
              background: TONES[tone].bg,
              color: TONES[tone].fg,
              fontWeight: 800,
              fontSize: 11,
            }}
          >
            {TONES[tone].mark}
          </span>
          {text}
        </span>
      ))}
    </p>
  );
}

const nameCell = (app: App, kind: Kind) => (
  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
    <StateIcon app={app} kind={kind} />
    <a href={`/admin/collections/applications/${app.id}`}>{app.name}</a>
  </span>
);
const right = { textAlign: 'right' as const, whiteSpace: 'nowrap' as const };

const PaidText = ({ app }: { app: App }) =>
  app.paidOnline ? (
    <span>Online fizetve</span>
  ) : app.paidOffline ? (
    <span>Fizetve{app.paymentNote && <span className={s.muted}> · {app.paymentNote}</span>}</span>
  ) : (
    <span className={s.muted}>—</span>
  );

/** The one place a decision is made: payment fields + the actions this application allows. */
function DecisionDialog({
  app,
  kind,
  context,
  groups,
  busy,
  onClose,
  onDecide,
}: {
  app: App;
  kind: Kind;
  context: string;
  /** The groups of this kind, to admit into (when the application has none). */
  groups: Data['groups']['beginner'];
  busy: boolean;
  onClose: () => void;
  onDecide: (input: { decision: Decision; paid?: boolean; paymentNote?: string; groupId?: number | null }) => void;
}) {
  const titleId = useId();
  const [paid, setPaid] = useState(app.paidOffline);
  const [note, setNote] = useState(app.paymentNote);
  const [group, setGroup] = useState<number | ''>(app.group?.id ?? (groups.length === 1 ? (groups[0]?.id ?? '') : ''));
  const [confirm, setConfirm] = useState<Decision | null>(null);
  const payment = kind === 'professional' ? {} : { paid, paymentNote: note };
  // szakmai: always chosen at admission; kezdő: only when the application came without a group
  const choosesGroup = kind === 'professional' || (kind === 'beginner' && !app.group);
  const go = (decision: Decision) => onDecide({ decision, ...payment, groupId: group || null });
  // decisions that can't be undone ask once more (the button's text changes)
  const ask = (decision: Decision) => (confirm === decision ? go(decision) : setConfirm(decision));
  const label = (decision: Decision, text: string, sure: string) => (confirm === decision ? sure : text);

  return (
    <Dialog
      open
      onClose={onClose}
      labelledBy={titleId}
      className={s.dialog ?? ''}
      closeButtonClassName={s.close}
      closeLabel="Bezárás"
    >
      <div className={s.form}>
        <h2 id={titleId} style={{ margin: 0 }}>
          {app.name}
        </h2>
        <p className={s.muted} style={{ margin: 0 }}>
          {context} · {app.email} · {app.phone} · {APPLICATION_STATUSES[app.status]}
        </p>

        {kind !== 'professional' && (
          <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
            <legend>Fizetés</legend>
            <label className={s.check}>
              <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
              Fizetve (átutalás / készpénz)
            </label>
            <label className={s.field}>
              Megjegyzés
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="pl. átutalta 10.12." />
            </label>
          </fieldset>
        )}

        {choosesGroup && (
          <label className={s.field}>
            Csoport (a felvételhez)
            <select value={group} onChange={(e) => setGroup(e.target.value ? Number(e.target.value) : '')}>
              <option value="">—</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className={s.actions} style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          {kind !== 'professional' && (
            <button type="button" className={s.btn} disabled={busy} onClick={() => go('save')}>
              Mentés
            </button>
          )}
          {kind === 'beginner' && (
            <button
              type="button"
              className={`${s.btn} ${s.primary}`}
              disabled={busy || (choosesGroup && !group)}
              onClick={() => ask('admit')}
            >
              {choosesGroup
                ? label(
                    'admit',
                    'Mentés és csoportba helyezés',
                    'Biztosan ebbe a csoportba veszed fel? (Üdvözlő levél megy.)',
                  )
                : label('admit', 'Mentés és felvétel', 'Biztosan felveszed? (Üdvözlő levél megy.)')}
            </button>
          )}
          {kind === 'professional' && app.status === 'new' && (
            <button type="button" className={s.btn} disabled={busy} onClick={() => go('interview')}>
              Interjú
            </button>
          )}
          {kind === 'professional' && (
            <button
              type="button"
              className={`${s.btn} ${s.primary}`}
              disabled={busy || !group}
              onClick={() => ask('admit')}
            >
              {label('admit', 'Felvétel és csoportba helyezés', 'Biztosan felveszed ebbe a csoportba?')}
            </button>
          )}
          {kind !== 'workshop' && (
            <button type="button" className={`${s.btn} ${s.danger}`} disabled={busy} onClick={() => ask('reject')}>
              {label('reject', 'Elutasítás', 'Biztosan elutasítod? (E-mail nem megy.)')}
            </button>
          )}
          {kind === 'workshop' && app.status === 'registered' && (
            <button type="button" className={`${s.btn} ${s.danger}`} disabled={busy} onClick={() => ask('cancel')}>
              {label('cancel', 'Lemondás', 'Biztosan lemondod? (E-mailt kap.)')}
            </button>
          )}
        </div>
        {choosesGroup && !group && (
          <p className={s.muted} style={{ margin: 0 }}>
            A felvételhez válassz csoportot.
          </p>
        )}
      </div>
    </Dialog>
  );
}

function Workshop({ w, busy, act, manage }: { w: Data['workshops'][number]; busy: boolean; act: Act; manage: Manage }) {
  const [adding, setAdding] = useState(false);
  const [writing, setWriting] = useState(false);
  const status =
    w.status === 'cancelled'
      ? 'Elmarad'
      : w.status === 'confirmed'
        ? WORKSHOP_STATUSES.confirmed
        : 'Gyűjti a jelentkezőket';

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? '').trim();
    const input = { lastName: v('lastName'), firstName: v('firstName'), email: v('email'), phone: v('phone') };
    if (await act(() => addParticipantAction(w.id, input))) setAdding(false);
  };
  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = String(f.get('subject') ?? '');
    const message = String(f.get('message') ?? '');
    if (await act(() => messageParticipantsAction(w.id, subject, message))) setWriting(false);
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
              <th>Fizetés</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {w.participants.map((p) => (
              <tr key={p.id} style={p.status === 'registered' ? undefined : { opacity: 0.55 }}>
                <td>
                  {p.status === 'registered' ? (
                    nameCell(p, 'workshop')
                  ) : (
                    <a href={`/admin/collections/applications/${p.id}`} style={{ marginLeft: 30 }}>
                      {p.name}
                    </a>
                  )}
                </td>
                <td>
                  {p.email}
                  <div className={s.muted}>{p.phone}</div>
                </td>
                <td>{APPLICATION_STATUSES[p.status]}</td>
                <td>
                  <PaidText app={p} />
                </td>
                <td style={right}>{p.status === 'registered' && manage(p, 'workshop', w.when)}</td>
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
          <label className={s.field}>
            Tárgy
            <input name="subject" placeholder={`Üzenet: Nyitott Műhely, ${w.when}`} />
          </label>
          <label className={s.field}>
            Üzenet
            <textarea name="message" rows={5} required />
          </label>
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

const SHOW_STATE = { free: 'Ingyenes', paid: 'Fizetve', waiting: 'Fizetésre vár' } as const;

/** One show booked on the site: its seats, then who booked how many (the door list). */
function ShowBookings({ show }: { show: Data['shows'][number] }) {
  return (
    <div className={s.panel} style={{ gap: 10, alignSelf: 'stretch' }}>
      <div className={s.row} style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong>
          {show.title} — {show.when}
        </strong>
        <span className={s.muted}>
          {show.taken} / {show.seats} jegy · {show.price ? `${show.price} Ft / jegy` : 'ingyenes'}
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
                <td>{b.seats}</td>
                <td>{SHOW_STATE[b.state]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
