import type { UIFieldServerProps } from 'payload';

/** A short explanation at the top of a page block in the admin (what the block shows, where its data comes from). */
export function BlockHelp({ field }: UIFieldServerProps) {
  const text = (field.admin?.custom as { text?: string } | undefined)?.text;
  return text ? <p style={{ margin: '0 0 1rem', color: 'var(--theme-elevation-500)', fontSize: '13px' }}>{text}</p> : null;
}
