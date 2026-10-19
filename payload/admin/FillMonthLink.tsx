import type { UIFieldServerProps } from 'payload';

/** Under a group's schedule: "Hónap feltöltése" for this group, in the room calendar. */
export function FillMonthLink({ id }: UIFieldServerProps) {
  if (!id)
    return (
      <p style={{ color: 'var(--theme-elevation-500)', fontSize: 13 }}>
        Mentés után a Teremnaptárban töltheted fel a hónapot.
      </p>
    );
  return (
    <p style={{ fontSize: 13, margin: '0 0 1.5rem' }}>
      <a
        href={`/admin/teremnaptar?feltoltes=${id}`}
        style={{ color: 'var(--theme-text)', textDecoration: 'underline' }}
      >
        Hónap feltöltése ennek a csoportnak →
      </a>{' '}
      <span style={{ color: 'var(--theme-elevation-500)' }}>(a Teremnaptárban: előnézet, majd létrehozás)</span>
    </p>
  );
}
