'use client';

/**
 * The site's form fields: the label above (with an optional hint after it and a note under the
 * control). Inside <RequiredMarks> required fields get a " *" (forms that say "a csillaggal jelölt
 * mezők kötelezők").
 */
import { createContext, type InputHTMLAttributes, type ReactNode, useContext } from 'react';

const Marks = createContext(false);
export const RequiredMarks = ({ children }: { children: ReactNode }) => (
  <Marks.Provider value={true}>{children}</Marks.Provider>
);

type Frame = {
  label: ReactNode;
  /** After the label, lighter: "(nem kötelező)". */
  hint?: ReactNode;
  /** Under the control, small. */
  note?: ReactNode;
  required?: boolean;
};

/** The label around any control (select, textarea…). */
export function Field({ label, hint, note, required, children }: Frame & { children: ReactNode }) {
  const marks = useContext(Marks);
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is `children`, inside the label
    <label className="field-label">
      <span>
        {label}
        {marks && required ? ' *' : ''}
        {hint && <span className="font-normal text-muted"> {hint}</span>}
      </span>
      {children}
      {note && <span className="text-xs font-normal text-muted">{note}</span>}
    </label>
  );
}

/** A labelled input; `value` is its starting value (the form keeps what is typed). */
export function TextField({
  label,
  hint,
  note,
  value,
  className = '',
  required = true,
  ...input
}: Frame & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> & { value?: string | null }) {
  return (
    <Field label={label} hint={hint} note={note} required={required}>
      <input className={`field ${className}`} required={required} defaultValue={value ?? undefined} {...input} />
    </Field>
  );
}
