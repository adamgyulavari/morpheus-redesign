'use client';

/**
 * /admin/teremnaptar: the room calendar for staff.
 * - Drag across free time, or click an entry: the form opens in the side panel (the calendar stays
 *   visible, the dragged range highlighted) — date, times, rooms; cancel or delete.
 * - Drag an entry to move it (a session's booking moves with it; a clash leaves it without a place).
 * - Drag an unplaced session from the side panel onto the calendar.
 * - "Hónap feltöltése" / "Generált alkalmak törlése": month and groups → the list (each tickable) → do it.
 */
import { Draggable } from '@fullcalendar/interaction';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import Dialog from '@/components/Dialog';
import { todayInBudapest } from '@/lib/dates';
import {
  adminSchedule,
  calendarOptions,
  createBooking,
  createSession,
  deleteEntry,
  deleteGeneratedSessions,
  fillMonthApply,
  fillMonthPreview,
  generatedPreview,
  groupsOfMonth,
  updateBooking,
  updateSession,
} from '@/lib/rooms/admin-actions';
import { whenText } from '@/lib/rooms/format';
import { BOOKING_KINDS, LOCATION_TYPES, type LocationType, SESSION_KINDS, type SessionKind } from '@/lib/rooms/labels';
import type { ScheduleEvent } from '@/lib/rooms/server';
import { addDays, at, clockOf, dayOf } from '@/lib/rooms/time';

import s from './calendar.module.css';
import RoomCalendar from './RoomCalendar';

type Options = NonNullable<Awaited<ReturnType<typeof calendarOptions>>>;
type Unplaced = NonNullable<Awaited<ReturnType<typeof adminSchedule>>>['unplaced'];

const duration = (start: string, end: string) => {
  const m = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** What the side-panel form edits: a new entry (a selection or a drop) or an existing one. */
type Draft = {
  start: Date;
  end: Date;
  roomIds: number[];
  existing?: ScheduleEvent;
  /** An unplaced session dropped on the calendar without rooms of its own. */
  placing?: { sessionId: number; title: string };
};

const EDITOR = 'cal-editor';

export default function AdminRoomCalendar({ isAdmin }: { isAdmin: boolean }) {
  const [opts, setOpts] = useState<Options | null>(null);
  const [version, setVersion] = useState(0);
  const [clearSelection, setClearSelection] = useState(0);
  const [unplaced, setUnplaced] = useState<Unplaced>([]);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const fillFor = useSearchParams().get('feltoltes');
  const [month, setMonth] = useState<'fill' | 'delete' | null>(fillFor ? 'fill' : null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    calendarOptions().then(setOpts);
  }, []);
  const reload = () => setVersion((v) => v + 1);
  const say = (text: string, error = false) => setToast({ text, error });
  const closeDraft = () => {
    setDraft(null);
    setClearSelection((n) => n + 1);
  };

  const load = useCallback(async (from: string, to: string) => {
    const r = await adminSchedule(from, to);
    if (!r) return null;
    setUnplaced(r.unplaced);
    return r.events;
  }, []);

  // unplaced sessions can be dragged onto the calendar (once the panel is rendered)
  const loaded = Boolean(opts);
  useEffect(() => {
    if (!loaded || !panel.current) return;
    const d = new Draggable(panel.current, {
      itemSelector: '[data-session-id]',
      eventData: (el) => ({ title: el.dataset.title, duration: el.dataset.duration, create: false }),
    });
    return () => d.destroy();
  }, [loaded]);

  if (!opts) return <p className={s.muted}>Betöltés…</p>;

  const onEventChange = async (e: ScheduleEvent, change: { start: Date; end: Date }, revert: () => void) => {
    const r = await updateBooking(e.bookingId, { start: change.start.toISOString(), end: change.end.toISOString() });
    if (!r.ok) {
      revert();
      return say(withOverrideHint(r.reason), true);
    }
    if ('locationType' in r && r.locationType === 'unplaced') {
      say('Az új időpontban ütközés van, ezért az alkalom helyszín nélkül maradt.', true);
    } else say('Áthelyezve.');
    reload();
  };

  const onDrop = async ({ sessionId, start }: { sessionId: number; start: Date }) => {
    const session = unplaced.find((u) => u.id === sessionId);
    if (!session) return;
    const end = new Date(start.getTime() + new Date(session.end).getTime() - new Date(session.start).getTime());
    // without rooms of its own: ask where
    if (!session.roomIds.length)
      return setDraft({ start, end, roomIds: [], placing: { sessionId, title: session.title } });
    const r = await updateSession(sessionId, {
      start: start.toISOString(),
      end: end.toISOString(),
      locationType: 'room',
      roomIds: session.roomIds,
    });
    if (!r.ok) return say(withOverrideHint(r.reason), true);
    say('Elhelyezve.');
    reload();
  };

  // a clash with student practice can be overridden from the form (admins)
  const withOverrideHint = (reason: string) =>
    isAdmin && reason.startsWith('Ütközik')
      ? `${reason} Ha diák-gyakorlással ütközik: kattints a bejegyzésre, és mentsd az „Ütköző diákfoglalások felülírása” bejelölésével.`
      : reason;

  return (
    <div className={s.admin}>
      <div className={s.layout}>
        <RoomCalendar
          theme="admin"
          rooms={opts.rooms}
          load={load}
          version={version}
          month
          editable
          selectable
          droppable
          keepSelectionIn={`.${EDITOR}`}
          clearSelection={clearSelection}
          onSelect={({ start, end }) => {
            setToast(null);
            setDraft({ start, end, roomIds: [] });
          }}
          onEventClick={(e) => {
            setToast(null);
            setDraft({ start: new Date(e.start), end: new Date(e.end), roomIds: e.roomIds, existing: e });
          }}
          onEventChange={onEventChange}
          onDrop={onDrop}
        />
        <div className={s.side}>
          {draft && (
            <div className={`${s.panel} ${EDITOR}`}>
              <EntryForm
                key={`${draft.start.getTime()}-${draft.existing?.id ?? draft.placing?.sessionId ?? 'new'}`}
                draft={draft}
                opts={opts}
                isAdmin={isAdmin}
                onClose={closeDraft}
                onDone={(text) => {
                  closeDraft();
                  say(text);
                  reload();
                }}
              />
            </div>
          )}
          <div className={s.panel} ref={panel}>
            <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => setMonth('fill')}>
              Hónap feltöltése
            </button>
            <button type="button" className={s.btn} onClick={() => setMonth('delete')}>
              Generált alkalmak törlése
            </button>
            {toast && (
              <p className={toast.error ? s.error : s.notice} role="status">
                {toast.text}
              </p>
            )}
            {unplaced.length > 0 && (
              <>
                <p className={s.panelTitle}>Helyszín nélküli alkalmak ({unplaced.length})</p>
                <p className={s.muted}>A látott időszakban. Húzd a naptárba az elhelyezéshez.</p>
                {unplaced.map((u) => (
                  <div
                    key={u.id}
                    className={s.chip}
                    data-session-id={u.id}
                    data-title={u.title}
                    data-duration={duration(u.start, u.end)}
                  >
                    <strong>{u.title}</strong>
                    <div className={s.muted}>
                      {whenText(u.start, u.end)} · {SESSION_KINDS[u.kind]}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <MonthDialog
        mode={month}
        initialGroup={fillFor ? Number(fillFor) : null}
        onClose={() => setMonth(null)}
        onDone={reload}
      />
    </div>
  );
}

// ── the side-panel form ─────────────────────────────────────────────────────

function EntryForm({
  draft,
  opts,
  isAdmin,
  onClose,
  onDone,
}: {
  draft: Draft;
  opts: Options;
  isAdmin: boolean;
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const [what, setWhat] = useState<'session' | 'booking'>('session');
  const [kind, setKind] = useState<SessionKind>('course');
  const [location, setLocation] = useState<LocationType>('room');
  const [confirm, setConfirm] = useState<'cancel' | 'delete' | null>(null);
  const [override, setOverride] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { existing, placing } = draft;
  const isSession = Boolean(existing?.sessionId || placing);
  const isNew = !existing && !placing;
  const heading = placing ? `Elhelyezés: ${placing.title}` : existing ? existing.title : 'Új bejegyzés';

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const day = String(f.get('day'));
    const start = at(day, String(f.get('startTime')));
    const end = at(day, String(f.get('endTime')));
    if (!(end > start)) return setError('A vége legyen a kezdés után.');
    const roomIds = f.getAll('rooms').map(Number);
    const times = { start: start.toISOString(), end: end.toISOString() };
    setBusy(true);
    let r: { ok: boolean; reason?: string; locationType?: string };
    if (placing) {
      r = await updateSession(placing.sessionId, {
        ...times,
        roomIds,
        locationType: 'room',
        overridePractice: override,
      });
    } else if (existing?.sessionId) {
      r = await updateSession(existing.sessionId, { ...times, roomIds, overridePractice: override });
    } else if (existing) {
      r = await updateBooking(existing.bookingId, { ...times, roomIds, overridePractice: override });
    } else if (what === 'session') {
      r = await createSession({
        kind,
        title: String(f.get('title') ?? ''),
        courseGroup: Number(f.get('courseGroup')) || null,
        production: Number(f.get('production')) || null,
        ...times,
        locationType: location,
        roomIds,
        externalLocation: String(f.get('externalLocation') ?? ''),
        overridePractice: override,
      });
    } else {
      r = await createBooking({
        kind: f.get('bookingKind') === 'other' ? 'other' : 'rental',
        title: String(f.get('title') ?? ''),
        ...times,
        roomIds,
        overridePractice: override,
      });
    }
    setBusy(false);
    if (!r.ok) return setError(r.reason ?? 'Hiba történt.');
    if (r.locationType === 'unplaced') return onDone('Mentve, de ütközés miatt az alkalom helyszín nélkül maradt.');
    onDone(isNew ? (what === 'session' ? 'Alkalom létrehozva.' : 'Foglalás létrehozva.') : 'Mentve.');
  };

  const act = async () => {
    if (!existing) return;
    setBusy(true);
    const r =
      confirm === 'delete'
        ? await deleteEntry({ sessionId: existing.sessionId, bookingId: existing.bookingId })
        : existing.sessionId
          ? await updateSession(existing.sessionId, { status: 'cancelled' })
          : await updateBooking(existing.bookingId, { status: 'cancelled', cancelReason: 'A munkatársak lemondták.' });
    setBusy(false);
    if (!r.ok) return setError(r.reason);
    onDone(confirm === 'delete' ? 'Törölve.' : isSession ? 'Az alkalom elmarad.' : 'A foglalás lemondva.');
  };

  return (
    <form className={s.form} onSubmit={save}>
      <p className={s.panelTitle}>{heading}</p>
      {existing && (
        <p className={s.muted}>
          {existing.kind === 'session' && existing.sessionKind
            ? SESSION_KINDS[existing.sessionKind]
            : BOOKING_KINDS[existing.kind]}
          {existing.owner && ` · ${existing.owner.title}`}
          {existing.booker && ` · foglalta: ${existing.booker}`}
          {existing.note && ` · „${existing.note}”`}
        </p>
      )}
      <label className={s.field}>
        Nap
        <input type="date" name="day" required defaultValue={dayOf(draft.start)} />
      </label>
      <div className={s.row}>
        <label className={s.field}>
          Kezdés
          <input type="time" name="startTime" required step={1800} defaultValue={clockOf(draft.start)} />
        </label>
        <label className={s.field}>
          Vége
          <input type="time" name="endTime" required step={1800} defaultValue={clockOf(draft.end)} />
        </label>
      </div>

      {isNew && (
        <div className={s.group}>
          <button type="button" className={s.btn} aria-pressed={what === 'session'} onClick={() => setWhat('session')}>
            Alkalom
          </button>
          <button type="button" className={s.btn} aria-pressed={what === 'booking'} onClick={() => setWhat('booking')}>
            Foglalás
          </button>
        </div>
      )}

      {isNew && what === 'session' && (
        <>
          <label className={s.field}>
            Típus
            <select value={kind} onChange={(e) => setKind(e.target.value as SessionKind)}>
              {Object.entries(SESSION_KINDS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {kind !== 'rehearsal' && (
            <label className={s.field}>
              Csoport {kind === 'course' ? '*' : '(nem kötelező)'}
              <select name="courseGroup" required={kind === 'course'} defaultValue="">
                <option value="">—</option>
                {opts.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind !== 'course' && (
            <label className={s.field}>
              Előadás {kind === 'rehearsal' ? '*' : '(nem kötelező)'}
              <select name="production" required={kind === 'rehearsal'} defaultValue="">
                <option value="">—</option>
                {opts.productions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={s.field}>
            Cím (nem kötelező)
            <input name="title" placeholder="Üresen a csoport / előadás neve" />
          </label>
          <label className={s.field}>
            Helyszín
            <select value={location} onChange={(e) => setLocation(e.target.value as LocationType)}>
              {Object.entries(LOCATION_TYPES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {location === 'external' && (
            <label className={s.field}>
              Külső helyszín *
              <input name="externalLocation" required />
            </label>
          )}
        </>
      )}
      {isNew && what === 'booking' && (
        <>
          <label className={s.field}>
            Típus
            <select name="bookingKind" defaultValue="rental">
              <option value="rental">{BOOKING_KINDS.rental}</option>
              <option value="other">{BOOKING_KINDS.other}</option>
            </select>
          </label>
          <label className={s.field}>
            Cím *
            <input name="title" required placeholder="Pl. Bérlés: XY tánccsoport" />
          </label>
        </>
      )}

      {(!isNew || what === 'booking' || location !== 'external') && (
        <fieldset className={`${s.field} ${s.fieldset}`}>
          <legend>Termek</legend>
          <div className={s.row}>
            {opts.rooms.map((r) => (
              <label key={r.id} className={s.check}>
                <input type="checkbox" name="rooms" value={r.id} defaultChecked={draft.roomIds.includes(r.id)} />
                {r.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {isAdmin && (
        <label className={s.check}>
          <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
          <span>
            Ütköző diákfoglalások felülírása
            <span className={s.muted} style={{ display: 'block' }}>
              Mentéskor lemondja az útban lévő diák-gyakorlásokat (a diákok e-mailt kapnak).
            </span>
          </span>
        </label>
      )}
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {confirm ? (
        <div className={s.row}>
          <span className={s.notice}>{confirm === 'delete' ? 'Biztosan törlöd?' : 'Biztosan lemondod?'}</span>
          <button type="button" className={`${s.btn} ${s.danger}`} onClick={act} disabled={busy}>
            Igen
          </button>
          <button type="button" className={s.btn} onClick={() => setConfirm(null)}>
            Mégse
          </button>
        </div>
      ) : (
        <>
          <div className={s.row}>
            <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy}>
              Mentés
            </button>
            <button type="button" className={s.btn} onClick={onClose}>
              Mégse
            </button>
          </div>
          {existing && (
            <div className={s.row}>
              <button type="button" className={`${s.btn} ${s.danger}`} onClick={() => setConfirm('cancel')}>
                {isSession ? 'Elmarad' : 'Lemondás'}
              </button>
              <button type="button" className={`${s.btn} ${s.danger}`} onClick={() => setConfirm('delete')}>
                Törlés
              </button>
              <a
                className={s.btn}
                href={
                  existing.sessionId
                    ? `/admin/collections/sessions/${existing.sessionId}`
                    : `/admin/collections/roomBookings/${existing.bookingId}`
                }
                target="_blank"
                rel="noopener"
              >
                Részletek
              </a>
            </div>
          )}
        </>
      )}
    </form>
  );
}

// ── fill month / delete generated ───────────────────────────────────────────

type Row = { id: string; title: string; start: string; end: string; detail?: ReactNode; warn?: boolean };

const nextMonth = () => addDays(todayInBudapest(), 31).slice(0, 7);

/**
 * Both month actions in three steps: 1. month and groups → 2. the list, each row tickable →
 * 3. the result. Fill creates the ticked sessions; delete removes the ticked generated ones.
 */
function MonthDialog({
  mode,
  initialGroup,
  onClose,
  onDone,
}: {
  mode: 'fill' | 'delete' | null;
  initialGroup: number | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [month, setMonth] = useState(nextMonth);
  const [groups, setGroups] = useState<{ id: number; title: string }[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [y, m] = month.split('-').map(Number) as [number, number];
  const fill = mode === 'fill';

  // step 1: the groups running that month (all ticked, or the one we came from)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reload when the month changes or the dialog opens
  useEffect(() => {
    if (!mode) return;
    setStep(1);
    setResult('');
    groupsOfMonth(y, m).then((list) => {
      if (!list) return;
      setGroups(list);
      setSelectedGroups(
        initialGroup && list.some((g) => g.id === initialGroup) ? [initialGroup] : list.map((g) => g.id),
      );
    });
  }, [mode, month]);

  const next = async () => {
    setBusy(true);
    if (fill) {
      const p = await fillMonthPreview(y, m, selectedGroups);
      const items = p?.items ?? [];
      setRows(
        items.map((i) => ({
          id: i.key,
          title: i.title,
          start: i.start,
          end: i.end,
          warn: i.clashes.length > 0,
          detail: i.clashes.length
            ? `${i.rooms.join(', ')} — helyszín nélkül lesz, ütközik: ${i.clashes.join('; ')}`
            : i.rooms.join(', '),
        })),
      );
      setTicked(new Set(items.map((i) => i.key)));
    } else {
      const list = (await generatedPreview(y, m, selectedGroups)) ?? [];
      setRows(
        list.map((d) => ({
          id: String(d.id),
          title: d.title,
          start: d.start,
          end: d.end,
          detail: d.placed ? undefined : 'helyszín nélkül',
        })),
      );
      setTicked(new Set(list.map((d) => String(d.id))));
    }
    setBusy(false);
    setStep(2);
  };

  const run = async () => {
    setBusy(true);
    if (fill) {
      const r = await fillMonthApply(y, m, selectedGroups, [...ticked]);
      if (r) {
        setResult(
          `${r.created} alkalom létrehozva, ${r.placed} teremmel.` +
            (r.unplaced.length
              ? ` ${r.unplaced.length} helyszín nélkül maradt — a Teremnaptár oldalsávjában helyezheted el.`
              : ''),
        );
      }
    } else {
      const r = await deleteGeneratedSessions(y, m, selectedGroups, [...ticked].map(Number));
      if (r) setResult(`${r.deleted} alkalom törölve.`);
    }
    setBusy(false);
    setStep(3);
    onDone();
  };

  const toggle = (id: string) =>
    setTicked((t) => {
      const n = new Set(t);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const all = rows.length > 0 && ticked.size === rows.length;

  return (
    <Dialog
      open={Boolean(mode)}
      onClose={onClose}
      labelledBy="month-dialog-title"
      className={s.dialog ?? ''}
      closeButtonClassName={s.close}
      closeLabel="Bezárás"
    >
      <div className={s.form}>
        <h2 id="month-dialog-title">{fill ? 'Hónap feltöltése' : 'Generált alkalmak törlése'}</h2>
        <ol className={s.steps}>
          <li aria-current={step === 1 ? 'step' : undefined}>1. Hónap és csoportok</li>
          <li aria-current={step === 2 ? 'step' : undefined}>
            2. {fill ? 'Létrehozandó alkalmak' : 'Törlendő alkalmak'}
          </li>
          <li aria-current={step === 3 ? 'step' : undefined}>3. Kész</li>
        </ol>

        {step === 1 && (
          <>
            <p className={s.muted}>
              {fill
                ? 'A csoportok órarendjéből a hónap alkalmai, terem-foglalással. A korábban már létrehozott napok (akkor is, ha azóta áthelyezték vagy elmaradt) és a zárva tartó napok kimaradnak.'
                : 'A hónap jövőbeli, kézzel nem módosított generált alkalmai (a foglalásukkal együtt). A kézzel módosítottak és a múltbeliek maradnak.'}
            </p>
            <label className={s.field}>
              Hónap
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
            <fieldset className={`${s.field} ${s.fieldset}`}>
              <legend>Csoportok, amelyek abban a hónapban futnak</legend>
              {groups.length === 0 && <p className={s.muted}>Ebben a hónapban nincs futó csoport.</p>}
              {groups.map((g) => (
                <label key={g.id} className={s.check}>
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(g.id)}
                    onChange={(e) =>
                      setSelectedGroups((sel) => (e.target.checked ? [...sel, g.id] : sel.filter((i) => i !== g.id)))
                    }
                  />
                  {g.title}
                </label>
              ))}
            </fieldset>
            <div className={s.actions}>
              <button type="button" className={s.btn} onClick={onClose}>
                Mégse
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.primary}`}
                onClick={next}
                disabled={busy || !selectedGroups.length}
              >
                Tovább
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {rows.length === 0 ? (
              <p className={s.notice}>
                {fill ? 'Nincs új alkalom: ez a hónap már fel van töltve.' : 'Nincs törölhető generált alkalom.'}
              </p>
            ) : (
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Mind"
                        checked={all}
                        onChange={() => setTicked(all ? new Set() : new Set(rows.map((r) => r.id)))}
                      />
                    </th>
                    <th>Mikor</th>
                    <th>Csoport</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={r.warn ? s.clash : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`${r.title} ${whenText(r.start, r.end)}`}
                          checked={ticked.has(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      </td>
                      <td>{whenText(r.start, r.end)}</td>
                      <td>
                        {r.title}
                        {r.detail && <div className={r.warn ? undefined : s.muted}>{r.detail}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className={s.actions}>
              <button type="button" className={s.btn} onClick={() => setStep(1)}>
                Vissza
              </button>
              {rows.length > 0 && (
                <button
                  type="button"
                  className={`${s.btn} ${fill ? s.primary : s.danger}`}
                  onClick={run}
                  disabled={busy || ticked.size === 0}
                >
                  {fill ? `${ticked.size} alkalom létrehozása` : `${ticked.size} alkalom törlése`}
                </button>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className={s.notice} role="status">
              {result}
            </p>
            <div className={s.actions}>
              <button type="button" className={`${s.btn} ${s.primary}`} onClick={onClose}>
                Bezárás
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
