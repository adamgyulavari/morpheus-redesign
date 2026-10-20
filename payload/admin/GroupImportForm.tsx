'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { importGroupsAction } from '@/lib/applications/admin-actions';
import type { ImportResult } from '@/lib/applications/group-import';
import { GROUP_TYPES } from '@/lib/applications/labels';
import { WEEKDAYS } from '@/lib/rooms/labels';

import s from './admin.module.css';

/**
 * The import box: the file, the slot's rooms, the welcome e-mail toggle; "Előnézet" says what would
 * happen, then "Importálás" does it. Safe to run again: groups by name, members by e-mail, only added.
 */
export function GroupImportForm({ rooms }: { rooms: { id: number; name: string }[] }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [roomIds, setRoomIds] = useState(() => rooms.filter((r) => r.name === 'Nagyterem').map((r) => r.id));
  const [email, setEmail] = useState(false);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const changed = () => {
    setPreview(null);
    setDone(null);
    setError('');
  };
  const run = (dryRun: boolean) =>
    start(async () => {
      setError('');
      const r = await importGroupsAction(text, { roomIds, email, dryRun });
      if (!r.ok) return setError(r.reason);
      if (dryRun) return setPreview(r.result);
      setPreview(null);
      setDone(r.result);
      router.refresh();
    });
  const shown = done ?? preview;

  return (
    <details className={s.admin} style={{ margin: '0 0 24px' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Importálás fájlból</summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        <p className={s.muted} style={{ margin: 0 }}>
          JSON-fájl: {'{ groups: [{ name, weekday, startTime, members: [{ name, email }] }] }'}. A típus a névből jön
          (kezdő, szakmai, társulat); kezdőnél 2, a többinél 3 órás heti időpont, idei dátumokkal. Kezdési idő nélkül a
          csoport véget ért (a múlt hónap végén); a társulatnak nincs dátuma és órarendje. A hallgatókat e-mail alapján
          keressük; akinek nincs fiókja, kap egyet (nem megerősített). Újra futtatható: csak hozzáad, senkit nem vesz
          ki.
        </p>
        <div className={s.row} style={{ gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label className={s.field}>
            Fájl
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                changed();
                setText((await e.target.files?.[0]?.text()) ?? '');
              }}
            />
          </label>
          <fieldset className={s.fieldset}>
            <legend>Az órarend terme</legend>
            {rooms.map((r) => (
              <label key={r.id} className={s.check}>
                <input
                  type="checkbox"
                  checked={roomIds.includes(r.id)}
                  onChange={(e) => {
                    changed();
                    setRoomIds(e.target.checked ? [...roomIds, r.id] : roomIds.filter((id) => id !== r.id));
                  }}
                />
                {r.name}
              </label>
            ))}
          </fieldset>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={email}
              onChange={(e) => {
                changed();
                setEmail(e.target.checked);
              }}
            />
            „Felvétel a kurzusba” e-mail az újonnan felvetteknek (belépőlinkkel; véget ért csoportnál nem)
          </label>
        </div>
        <div className={s.row} style={{ gap: 12 }}>
          <button type="button" className={s.btn} disabled={pending || !text} onClick={() => run(true)}>
            {pending && !preview ? 'Egy pillanat…' : 'Előnézet'}
          </button>
          {preview && (
            <button type="button" className={`${s.btn} ${s.primary}`} disabled={pending} onClick={() => run(false)}>
              {pending
                ? 'Importálás…'
                : `Importálás${email ? `, ${preview.groups.reduce((n, g) => n + g.added, 0)} e-mail` : ', e-mail nélkül'}`}
            </button>
          )}
        </div>
        {error && (
          <p className={s.error} role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        )}
        {shown && (
          <div role="status">
            <p style={{ margin: '0 0 8px' }}>
              <strong>{done ? 'Kész.' : 'Előnézet — még semmi nem változott.'}</strong> Új fiók: {shown.accountsCreated}
              {done && `; elküldött e-mail: ${done.emailsSent}`}.
            </p>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Csoport</th>
                  <th>Típus</th>
                  <th>Dátumok</th>
                  <th>Órarend</th>
                  <th>Új tag / összes</th>
                </tr>
              </thead>
              <tbody>
                {shown.groups.map((g) => (
                  <tr key={g.title}>
                    <td>
                      {g.title} <span className={s.muted}>{g.created ? '(új)' : '(meglévő)'}</span>
                    </td>
                    <td>{GROUP_TYPES[g.type]}</td>
                    <td>{g.startDate ? `${g.startDate} – ${g.endDate}` : '—'}</td>
                    <td>
                      {g.schedule
                        ? `${WEEKDAYS[Number(g.schedule.weekday) - 1]} ${g.schedule.startTime}–${g.schedule.endTime}`
                        : '—'}
                    </td>
                    <td>
                      +{g.added} / {g.members}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  );
}
