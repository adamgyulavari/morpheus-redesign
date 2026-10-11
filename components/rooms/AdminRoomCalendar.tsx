'use client';

/**
 * /admin/teremnaptar: the room calendar for staff. Drag across free time to add a session or a
 * booking; click an entry to edit its time and rooms, cancel or delete it; drag an entry to move
 * it (a session's booking moves with it; a clash leaves it without a place); drag an unplaced
 * session from the side panel onto the calendar; "Hónap feltöltése".
 */
import { Draggable } from '@fullcalendar/interaction';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import {
  adminSchedule,
  calendarOptions,
  createBooking,
  createSession,
  deleteEntry,
  deleteGeneratedSessions,
  fillMonthApply,
  fillMonthPreview,
  updateBooking,
  updateSession,
} from '@/lib/rooms/admin-actions';
import { BOOKING_KINDS, LOCATION_TYPES, type LocationType, SESSION_KINDS, type SessionKind } from '@/lib/rooms/labels';
import type { FillPreviewItem, ScheduleEvent } from '@/lib/rooms/server';
import { addDays, at, clockOf, dayOf, TZ } from '@/lib/rooms/time';

import s from './calendar.module.css';
import Modal from './Modal';
import RoomCalendar from './RoomCalendar';

type Options = NonNullable<Awaited<ReturnType<typeof calendarOptions>>>;
type Unplaced = NonNullable<Awaited<ReturnType<typeof adminSchedule>>>['unplaced'];

const when = (start: string | Date, end: string | Date) => {
  const a = new Date(start);
  const date = new Intl.DateTimeFormat('hu-HU', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(a);
  return `${date} ${clockOf(a)}–${clockOf(new Date(end))}`;
};
const duration = (start: string, end: string) => {
  const m = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** What the form edits: a new entry (from a selection or a drop) or an existing one. */
type Draft = {
  start: Date;
  end: Date;
  roomIds: number[];
  existing?: ScheduleEvent;
  /** An unplaced session dropped on the calendar without rooms of its own. */
  placing?: { sessionId: number; title: string };
};

export default function AdminRoomCalendar({ isAdmin }: { isAdmin: boolean }) {
  const [opts, setOpts] = useState<Options | null>(null);
  const [version, setVersion] = useState(0);
  const [unplaced, setUnplaced] = useState<Unplaced>([]);
  const [override, setOverride] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const fillFor = useSearchParams().get('feltoltes');
  const [fill, setFill] = useState<boolean>(Boolean(fillFor));
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    calendarOptions().then(setOpts);
  }, []);
  const reload = () => setVersion((v) => v + 1);
  const say = (text: string, error = false) => setToast({ text, error });

  const load = useCallback(async (from: string, to: string) => {
    const r = await adminSchedule(null, from, to);
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
    const r = await updateBooking(e.bookingId, {
      start: change.start.toISOString(),
      end: change.end.toISOString(),
      overridePractice: override,
    });
    if (!r.ok) {
      revert();
      return say(r.reason, true);
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
      overridePractice: override,
    });
    if (!r.ok) return say(r.reason, true);
    say('Elhelyezve.');
    reload();
  };

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
          onSelect={({ start, end }) => setDraft({ start, end, roomIds: [] })}
          onEventClick={(e) =>
            setDraft({ start: new Date(e.start), end: new Date(e.end), roomIds: e.roomIds, existing: e })
          }
          onEventChange={onEventChange}
          onDrop={onDrop}
        />
        <div className={s.panel} ref={panel}>
          <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => setFill(true)}>
            Hónap feltöltése
          </button>
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
                {when(u.start, u.end)} · {SESSION_KINDS[u.kind]}
              </div>
            </div>
          ))}
          {isAdmin && (
            <label className={s.check}>
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              <span>
                Ütköző diákfoglalások felülírása
                <span className={s.muted} style={{ display: 'block' }}>
                  Áthelyezésnél és új bejegyzésnél lemondja az útban lévő diák-gyakorlásokat (a diákok e-mailt kapnak).
                </span>
              </span>
            </label>
          )}
          {toast && (
            <p className={toast.error ? s.error : s.notice} role="status">
              {toast.text}
            </p>
          )}
        </div>
      </div>

      <EntryDialog
        draft={draft}
        opts={opts}
        override={override}
        onClose={() => setDraft(null)}
        onDone={(text) => {
          setDraft(null);
          say(text);
          reload();
        }}
      />
      <FillDialog
        open={fill}
        initialGroup={fillFor ? Number(fillFor) : null}
        onClose={() => setFill(false)}
        onDone={reload}
      />
    </div>
  );
}

// ── new or existing entry ───────────────────────────────────────────────────

function EntryDialog({
  draft,
  opts,
  override,
  onClose,
  onDone,
}: {
  draft: Draft | null;
  opts: Options;
  override: boolean;
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const [what, setWhat] = useState<'session' | 'booking'>('session');
  const [kind, setKind] = useState<SessionKind>('course');
  const [location, setLocation] = useState<LocationType>('room');
  const [confirm, setConfirm] = useState<'cancel' | 'delete' | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when another entry opens
  useEffect(() => {
    setError('');
    setConfirm(null);
    setLocation('room');
  }, [draft]);

  const existing = draft?.existing;
  const isSession = Boolean(existing?.sessionId || draft?.placing);
  const title = draft?.placing ? `Elhelyezés: ${draft.placing.title}` : existing ? existing.title : 'Új bejegyzés';

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft) return;
    const f = new FormData(e.currentTarget);
    const day = String(f.get('day'));
    const start = at(day, String(f.get('startTime')));
    const end = at(day, String(f.get('endTime')));
    if (!(end > start)) return setError('A vége legyen a kezdés után.');
    const roomIds = f.getAll('rooms').map(Number);
    const times = { start: start.toISOString(), end: end.toISOString() };
    setBusy(true);
    let r: { ok: boolean; reason?: string; locationType?: string };
    if (draft.placing) {
      r = await updateSession(draft.placing.sessionId, {
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
    onDone(existing || draft.placing ? 'Mentve.' : what === 'session' ? 'Alkalom létrehozva.' : 'Foglalás létrehozva.');
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
    <Modal open={Boolean(draft)} onClose={onClose} title={title}>
      {draft && (
        <form className={s.form} onSubmit={save}>
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
          <div className={s.row}>
            <label className={s.field}>
              Nap
              <input type="date" name="day" required defaultValue={dayOf(draft.start)} />
            </label>
            <label className={s.field}>
              Kezdés
              <input type="time" name="startTime" required step={1800} defaultValue={clockOf(draft.start)} />
            </label>
            <label className={s.field}>
              Vége
              <input type="time" name="endTime" required step={1800} defaultValue={clockOf(draft.end)} />
            </label>
          </div>

          {!existing && !draft.placing && (
            <div className={s.group}>
              <button
                type="button"
                className={s.btn}
                aria-pressed={what === 'session'}
                onClick={() => setWhat('session')}
              >
                Alkalom
              </button>
              <button
                type="button"
                className={s.btn}
                aria-pressed={what === 'booking'}
                onClick={() => setWhat('booking')}
              >
                Foglalás (bérlés, egyéb)
              </button>
            </div>
          )}

          {!existing && !draft.placing && what === 'session' && (
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
          {!existing && !draft.placing && what === 'booking' && (
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

          {(existing || draft.placing || what === 'booking' || location !== 'external') && (
            <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
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
            <div className={s.row}>
              <button type="submit" className={`${s.btn} ${s.primary}`} disabled={busy}>
                Mentés
              </button>
              {existing && (
                <>
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
                    Részletek az adminban
                  </a>
                </>
              )}
              <button type="button" className={s.btn} onClick={onClose}>
                Mégse
              </button>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}

// ── fill month ──────────────────────────────────────────────────────────────

const nextMonth = () => addDays(dayOf(new Date()), 31).slice(0, 7);

function FillDialog({
  open,
  initialGroup,
  onClose,
  onDone,
}: {
  open: boolean;
  initialGroup: number | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [month, setMonth] = useState(nextMonth);
  const [groups, setGroups] = useState<{ id: number; title: string }[]>([]);
  const [selected, setSelected] = useState<number[] | null>(initialGroup ? [initialGroup] : null);
  const [items, setItems] = useState<FillPreviewItem[] | null>(null);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [y, m] = month.split('-').map(Number) as [number, number];

  // the groups running that month (the default selection)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reload when the month changes or the dialog opens
  useEffect(() => {
    if (!open) return;
    setResult('');
    setConfirmDelete(false);
    fillMonthPreview(y, m, null).then((p) => {
      if (!p) return;
      setGroups(p.groups);
      setSelected((prev) => (initialGroup && prev ? prev : p.groups.map((g) => g.id)));
      setItems(null);
    });
  }, [open, month]);

  const ids = selected ?? groups.map((g) => g.id);
  const preview = async () => {
    setBusy(true);
    const p = await fillMonthPreview(y, m, ids);
    setBusy(false);
    setItems(p?.items ?? []);
    setResult('');
  };
  const apply = async () => {
    setBusy(true);
    const r = await fillMonthApply(y, m, ids);
    setBusy(false);
    if (!r) return;
    setItems(null);
    setResult(
      `${r.created} alkalom létrehozva, ${r.placed} teremmel.` +
        (r.unplaced.length
          ? ` ${r.unplaced.length} helyszín nélkül maradt (ütközés): ${r.unplaced.map((u) => `${u.title} ${u.day}`).join('; ')}.`
          : ''),
    );
    onDone();
  };
  const remove = async () => {
    setBusy(true);
    const r = await deleteGeneratedSessions(y, m, ids);
    setBusy(false);
    setConfirmDelete(false);
    if (r) setResult(`${r.deleted} generált alkalom törölve (a kézzel módosítottak és a múltbeliek maradtak).`);
    onDone();
  };

  return (
    <Modal open={open} onClose={onClose} title="Hónap feltöltése">
      <div className={s.form}>
        <p className={s.muted}>
          A csoportok órarendjéből létrehozza a hónap alkalmait, terem-foglalással. A már korábban létrehozott napokat
          kihagyja (akkor is, ha azóta áthelyezték vagy elmaradt), a zárva tartó napokra nem tesz semmit. Ütközés esetén
          az alkalom helyszín nélkül jön létre.
        </p>
        <label className={s.field}>
          Hónap
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend>Csoportok (amelyek abban a hónapban futnak)</legend>
          {groups.length === 0 && <p className={s.muted}>Ebben a hónapban nincs futó csoport.</p>}
          {groups.map((g) => (
            <label key={g.id} className={s.check}>
              <input
                type="checkbox"
                checked={ids.includes(g.id)}
                onChange={(e) => setSelected(e.target.checked ? [...ids, g.id] : ids.filter((i) => i !== g.id))}
              />
              {g.title}
            </label>
          ))}
        </fieldset>
        <div className={s.row}>
          <button type="button" className={s.btn} onClick={preview} disabled={busy || !ids.length}>
            Előnézet
          </button>
          {items && items.length > 0 && (
            <button type="button" className={`${s.btn} ${s.primary}`} onClick={apply} disabled={busy}>
              {items.length} alkalom létrehozása
            </button>
          )}
        </div>
        {items && items.length === 0 && <p className={s.notice}>Nincs új alkalom: ez a hónap már fel van töltve.</p>}
        {items && items.length > 0 && (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Mikor</th>
                <th>Csoport</th>
                <th>Terem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={`${i.title}-${i.start}`} className={i.clashes.length ? s.clash : undefined}>
                  <td>{when(i.start, i.end)}</td>
                  <td>{i.title}</td>
                  <td>
                    {i.rooms.join(', ')}
                    {i.clashes.length > 0 && <div>Helyszín nélkül lesz — ütközik: {i.clashes.join('; ')}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {result && (
          <p className={s.notice} role="status">
            {result}
          </p>
        )}
        <hr style={{ border: 0, borderTop: '1px solid var(--cal-line)', width: '100%' }} />
        {confirmDelete ? (
          <div className={s.row}>
            <span className={s.notice}>
              Törlöd a hónap jövőbeli, kézzel nem módosított generált alkalmait a kiválasztott csoportoknál?
            </span>
            <button type="button" className={`${s.btn} ${s.danger}`} onClick={remove} disabled={busy}>
              Igen, törlés
            </button>
            <button type="button" className={s.btn} onClick={() => setConfirmDelete(false)}>
              Mégse
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`${s.btn} ${s.danger}`}
            onClick={() => setConfirmDelete(true)}
            disabled={busy || !ids.length}
          >
            Generált alkalmak törlése
          </button>
        )}
      </div>
    </Modal>
  );
}
