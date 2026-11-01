'use client';

/**
 * Next to every admin action that e-mails someone: who gets what, and a box to leave it out. The
 * action sends only while it's ticked (its server side takes `notify`).
 */
import s from './admin.module.css';

export function EmailToggle({
  checked,
  onChange,
  to,
  what,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Who: a name and address, or e.g. "az érintett diákok". */
  to: string;
  /** Which e-mail, e.g. „Felvettünk a csoportba”. */
  what: string;
}) {
  return (
    <label className={s.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {checked ? 'E-mail megy ki: ' : 'E-mail nem megy ki: '}
        <strong>{to}</strong>
        <span className={s.muted} style={{ display: 'block' }}>
          {what}
        </span>
      </span>
    </label>
  );
}
