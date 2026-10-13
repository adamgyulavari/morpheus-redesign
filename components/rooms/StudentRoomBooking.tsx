'use client';

/**
 * /fiokom/terem: the room calendar for active students. Everything booked is visible (sessions,
 * rentals, others' practice with the booker's name); drag across free time to book practice —
 * the sheet asks for the room and, optionally, what it is for. Own bookings can be cancelled.
 * The server re-checks every rule (lib/rooms/rules.ts).
 */
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useState } from 'react';

import Dialog from '@/components/Dialog';
import { whenText } from '@/lib/rooms/format';
import type { ScheduleEvent } from '@/lib/rooms/server';
import type { OverviewPractice } from '@/lib/rooms/student';
import { bookPracticeAction, cancelPracticeAction, loadSchedule } from '@/lib/rooms/student-actions';
import { at, clockOf, dayOf } from '@/lib/rooms/time';

import type { CalRoom } from './calendar-core';
import OwnBooking from './OwnBooking';
import RoomCalendar from './RoomCalendar';

type Props = {
  rooms: CalRoom[];
  groups: { id: number; title: string }[];
  productions: { id: number; title: string }[];
  bookings: OverviewPractice[];
  slotMinutes: number;
  rules: string;
};

type Sheet = { mode: 'book'; start: Date; end: Date } | { mode: 'cancel'; id: number; when: string; rooms: string };

const dialog =
  'm-auto w-[min(92vw,520px)] rounded-[22px] border-0 bg-paper p-6 text-ink shadow-[0_30px_60px_-20px_rgba(8,31,34,0.6)] backdrop:bg-night/60 lg:p-8';

export default function StudentRoomBooking({ rooms, groups, productions, bookings, slotMinutes, rules }: Props) {
  const router = useRouter();
  const [version, setVersion] = useState(0);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const bookable = rooms.filter((r) => r.studentBookable);

  const load = useCallback((from: string, to: string) => loadSchedule(from, to), []);
  const done = (text: string) => {
    setSheet(null);
    setError('');
    setNotice(text);
    setVersion((v) => v + 1);
    router.refresh();
  };
  const open = (s: Sheet) => {
    setError('');
    setNotice('');
    setSheet(s);
  };

  const book = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const day = String(f.get('day'));
    const start = at(day, String(f.get('startTime')));
    const end = at(day, String(f.get('endTime')));
    const link = String(f.get('link') ?? '');
    setBusy(true);
    const r = await bookPracticeAction({
      roomIds: [Number(f.get('room'))],
      start: start.toISOString(),
      end: end.toISOString(),
      courseGroup: link.startsWith('g') ? Number(link.slice(1)) : null,
      production: link.startsWith('p') ? Number(link.slice(1)) : null,
      note: String(f.get('note') ?? ''),
    });
    setBusy(false);
    if (!r.ok) return setError(r.reason);
    done('Lefoglaltad a termet.');
  };

  const cancel = async () => {
    if (sheet?.mode !== 'cancel') return;
    setBusy(true);
    const r = await cancelPracticeAction(sheet.id);
    setBusy(false);
    if (!r.ok) return setError(r.reason);
    done('Lemondtad a foglalást.');
  };

  const onEventClick = (e: ScheduleEvent) => {
    if (e.kind !== 'practice' || !e.own) return;
    open({
      mode: 'cancel',
      id: e.bookingId,
      when: whenText(e.start, e.end, 'long'),
      rooms: e.roomIds.map((id) => rooms.find((r) => r.id === id)?.name).join(', '),
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[760px] text-[15px] leading-relaxed text-ink2">{rules}</p>
      {notice && (
        <p role="status" className="rounded-xl bg-teal/10 px-4 py-3 text-[15px] font-semibold text-teal">
          {notice}
        </p>
      )}
      <RoomCalendar
        theme="site"
        rooms={rooms}
        load={load}
        version={version}
        selectable
        futureOnly
        ownLabel="Saját foglalás"
        onSelect={({ start, end }) => open({ mode: 'book', start, end })}
        onEventClick={onEventClick}
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-[32px] leading-none lg:text-[40px]">Közelgő foglalásaim</h2>
        {bookings.length === 0 ? (
          <p className="text-[15px] text-muted">Nincs közelgő foglalásod. Húzz ki egy szabad időszakot a naptárban.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bookings.map((b) => (
              <OwnBooking
                key={b.id}
                booking={b}
                action={
                  <button
                    type="button"
                    className="link text-[15px] font-semibold text-rust-dark"
                    onClick={() =>
                      open({ mode: 'cancel', id: b.id, when: whenText(b.start, b.end, 'long'), rooms: b.rooms })
                    }
                  >
                    Lemondás
                  </button>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(sheet)} onClose={() => setSheet(null)} labelledBy="room-sheet-title" className={dialog}>
        {sheet?.mode === 'book' && (
          <form className="flex flex-col gap-4" onSubmit={book}>
            <h2 id="room-sheet-title" className="pr-12 font-display text-[32px] leading-none">
              Teremfoglalás
            </h2>
            <label className="field-label">
              Nap
              <input className="field" type="date" name="day" required defaultValue={dayOf(sheet.start)} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="field-label">
                Kezdés
                <input
                  className="field"
                  type="time"
                  name="startTime"
                  required
                  step={slotMinutes * 60}
                  defaultValue={clockOf(sheet.start)}
                />
              </label>
              <label className="field-label">
                Vége
                <input
                  className="field"
                  type="time"
                  name="endTime"
                  required
                  step={slotMinutes * 60}
                  defaultValue={clockOf(sheet.end)}
                />
              </label>
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-semibold">Terem</legend>
              {bookable.map((r, i) => (
                <label key={r.id} className="flex items-center gap-3 text-[15px]">
                  <input
                    type="radio"
                    name="room"
                    value={r.id}
                    required
                    defaultChecked={i === 0}
                    className="h-5 w-5 accent-teal"
                  />
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                  {r.name}
                </label>
              ))}
            </fieldset>
            <label className="field-label">
              Mihez gyakorolsz? <span className="font-normal text-muted">(nem kötelező)</span>
              <select className="field" name="link" defaultValue="">
                <option value="">—</option>
                {groups.length > 0 && (
                  <optgroup label="Kurzus">
                    {groups.map((g) => (
                      <option key={g.id} value={`g${g.id}`}>
                        {g.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {productions.length > 0 && (
                  <optgroup label="Előadás">
                    {productions.map((p) => (
                      <option key={p.id} value={`p${p.id}`}>
                        {p.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <span className="text-xs font-normal text-muted">
                Ha kiválasztod, a csoporttársaid látják a fiókjukban, hogy gyakorolsz.
              </span>
            </label>
            <label className="field-label">
              Megjegyzés{' '}
              <span className="font-normal text-muted">(nem kötelező, csak te és a munkatársak látjátok)</span>
              <textarea className="field min-h-[80px]" name="note" maxLength={500} />
            </label>
            {error && (
              <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[15px] font-semibold text-rust-dark">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn btn-lg btn-primary" disabled={busy}>
                {busy ? 'Egy pillanat…' : 'Foglalás'}
              </button>
              <button type="button" className="btn btn-lg btn-outline" onClick={() => setSheet(null)}>
                Mégse
              </button>
            </div>
          </form>
        )}
        {sheet?.mode === 'cancel' && (
          <div className="flex flex-col gap-4">
            <h2 id="room-sheet-title" className="pr-12 font-display text-[32px] leading-none">
              Lemondod?
            </h2>
            <p className="text-[16px] text-ink2">
              {sheet.when} · {sheet.rooms}
            </p>
            {error && (
              <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[15px] font-semibold text-rust-dark">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-lg btn-primary" onClick={cancel} disabled={busy}>
                Igen, lemondom
              </button>
              <button type="button" className="btn btn-lg btn-outline" onClick={() => setSheet(null)}>
                Megtartom
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
