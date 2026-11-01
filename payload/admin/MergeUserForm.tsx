'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { mergePreviewAction, mergeUsersAction } from '@/lib/accounts/admin-actions';
import type { MergePreview } from '@/lib/accounts/merge';
import s from './admin.module.css';

/**
 * The merge box: the other account's e-mail → what of it moves here → which address stays → a
 * second click. The other account is deleted; nobody is e-mailed.
 */
export function MergeUserForm({ userId, email }: { userId: number; email: string }) {
  const router = useRouter();
  const [other, setOther] = useState('');
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [emailFrom, setEmailFrom] = useState<'keep' | 'drop'>('keep');
  const [sure, setSure] = useState(false);
  const [answer, setAnswer] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();

  const look = () =>
    start(async () => {
      setAnswer(null);
      setSure(false);
      const r = await mergePreviewAction(userId, other);
      if (!r.ok) {
        setPreview(null);
        return setAnswer({ text: r.reason, error: true });
      }
      setPreview(r.preview);
      setEmailFrom('keep');
    });
  const merge = () =>
    start(async () => {
      if (!preview) return;
      const r = await mergeUsersAction(userId, preview.other.id, emailFrom);
      setSure(false);
      if (!r.ok) return setAnswer({ text: r.reason, error: true });
      setPreview(null);
      setOther('');
      setAnswer({ text: `Összevonva; ${preview.other.email} fiókja törölve.` });
      router.refresh();
    });

  return (
    <section className={s.admin} style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '2rem 0' }}>
      <h3 style={{ margin: 0 }}>Fiók összevonása</h3>
      <p className={s.muted} style={{ margin: 0 }}>
        Ha ugyanannak az embernek van egy másik fiókja (pl. más címmel lépett be Google-lel): annak jelentkezései,
        rendelései, számlái, foglalásai és csoportjai átkerülnek ide, a Google-belépés is, a másik fiók pedig törlődik.
        E-mail nem megy ki.
      </p>
      <div className={s.row} style={{ gap: 12, alignItems: 'flex-end' }}>
        <label className={s.field} style={{ flex: 1, minWidth: 240 }}>
          A másik fiók e-mail-címe
          <input type="email" value={other} onChange={(e) => setOther(e.target.value)} />
        </label>
        <button type="button" className={s.btn} disabled={pending || !other.includes('@')} onClick={look}>
          Megnézem
        </button>
      </div>
      {preview && (
        <div className={s.panel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <strong>
            {preview.other.name} · {preview.other.email}
            {preview.other.google ? ' · Google-fiók' : ''}
          </strong>
          <span className={s.muted}>
            Átkerül ide: {preview.moves.length ? preview.moves.join(', ') : 'nincs mit áthozni'}.
          </span>
          {preview.problem ? (
            <p className={s.error}>{preview.problem}</p>
          ) : (
            <>
              <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0, gap: 6 }}>
                <legend>Megmaradó e-mail-cím (ezzel lép be, ide mennek a levelek)</legend>
                <label className={s.check}>
                  <input type="radio" checked={emailFrom === 'keep'} onChange={() => setEmailFrom('keep')} />
                  {email}
                </label>
                <label className={s.check}>
                  <input type="radio" checked={emailFrom === 'drop'} onChange={() => setEmailFrom('drop')} />
                  {preview.other.email}
                </label>
              </fieldset>
              <div className={s.row}>
                {sure ? (
                  <>
                    <button type="button" className={`${s.btn} ${s.danger}`} disabled={pending} onClick={merge}>
                      {pending ? 'Egy pillanat…' : `Igen, összevonom (${preview.other.email} törlődik)`}
                    </button>
                    <button type="button" className={s.btn} disabled={pending} onClick={() => setSure(false)}>
                      Mégse
                    </button>
                  </>
                ) : (
                  <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => setSure(true)}>
                    Összevonás…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {answer && (
        <p className={answer.error ? s.error : s.notice} role="status" style={{ margin: 0 }}>
          {answer.text}
        </p>
      )}
    </section>
  );
}
