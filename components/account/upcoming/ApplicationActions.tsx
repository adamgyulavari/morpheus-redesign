'use client';

/**
 * "Lemondás" / "Áthelyezés" / "Visszavonás" on the overview's rows: a confirmation, or the choice
 * of another Nyitott Műhely date, in the site's dialog. The server re-checks the rules.
 */
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';

import Dialog from '@/components/Dialog';
import { cancelApplicationAction, moveApplicationAction } from '@/lib/applications/actions';

type Props = {
  applicationId: number;
  /** What it is, for the dialog: "Nyitott Műhely — okt. 17., szombat". */
  title: string;
  canCancel: boolean;
  canMove: boolean;
  moveTargets?: { id: number; label: string }[];
  /** "Visszavonás" for a professional application. */
  cancelLabel?: string;
};

const linkButton = 'link text-[14px] font-semibold';

export default function ApplicationActions({
  applicationId,
  title,
  canCancel,
  canMove,
  moveTargets = [],
  cancelLabel,
}: Props) {
  const [mode, setMode] = useState<'cancel' | 'move' | null>(null);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const titleId = useId();
  if (!canCancel && !(canMove && moveTargets.length)) return null;

  const run = () =>
    start(async () => {
      setError('');
      const r =
        mode === 'cancel'
          ? await cancelApplicationAction(applicationId)
          : target
            ? await moveApplicationAction(applicationId, target)
            : { ok: false, reason: 'Válassz időpontot.' };
      if (!r.ok) return setError(r.reason ?? 'Hiba történt.');
      setMode(null);
      router.refresh();
    });

  return (
    <span className="flex shrink-0 gap-4">
      {canMove && moveTargets.length > 0 && (
        <button type="button" className={`${linkButton} text-teal`} onClick={() => setMode('move')}>
          Áthelyezés
        </button>
      )}
      {canCancel && (
        <button type="button" className={`${linkButton} text-rust-dark`} onClick={() => setMode('cancel')}>
          {cancelLabel ?? 'Lemondás'}
        </button>
      )}
      <Dialog
        open={mode !== null}
        onClose={() => setMode(null)}
        labelledBy={titleId}
        className="m-auto w-[min(92vw,520px)] rounded-[22px] border-0 bg-paper p-0 text-ink shadow-[0_30px_60px_-20px_rgba(8,31,34,0.6)] backdrop:bg-night/60 backdrop:backdrop-blur-[2px]"
        closeClassName="bg-paper lg:right-4 lg:top-4"
      >
        <div className="flex flex-col gap-5 px-6 pb-8 pt-6 lg:px-9 lg:pb-9 lg:pt-8">
          <div className="flex flex-col gap-1.5 pr-10">
            <h2 id={titleId} className="font-display text-[28px] leading-tight">
              {mode === 'move' ? 'Másik időpont' : cancelLabel ? 'Visszavonod?' : 'Lemondod?'}
            </h2>
            <p className="text-[15px] text-ink2">{title}</p>
          </div>
          {mode === 'move' && (
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Új időpont</legend>
              {moveTargets.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line px-4 py-3 text-[15px] has-[:checked]:border-teal has-[:checked]:bg-teal/5"
                >
                  <input
                    type="radio"
                    name="target"
                    className="h-4 w-4 accent-teal"
                    checked={target === t.id}
                    onChange={() => setTarget(t.id)}
                  />
                  {t.label}
                </label>
              ))}
            </fieldset>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[15px] font-semibold text-rust-dark">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={`btn btn-md ${mode === 'cancel' ? 'btn-outline' : 'btn-primary'} disabled:opacity-60`}
              disabled={pending || (mode === 'move' && !target)}
              onClick={run}
            >
              {pending
                ? 'Egy pillanat…'
                : mode === 'move'
                  ? 'Áthelyezem'
                  : cancelLabel
                    ? 'Igen, visszavonom'
                    : 'Igen, lemondom'}
            </button>
            <button type="button" className="btn btn-md btn-outline" onClick={() => setMode(null)}>
              Mégse
            </button>
          </div>
        </div>
      </Dialog>
    </span>
  );
}
