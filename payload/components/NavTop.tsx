import type { ServerProps } from 'payload';

import { unplacedListHref } from '@/lib/admin/home';
import { countWaiting } from '@/lib/applications/server';
import { countUnplaced } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';

const badge = { fontSize: 13, color: 'var(--theme-warning-500, #f9c86a)' } as const;

/**
 * Above the sidebar's groups: Irányítópult, Jelentkezések (with the applications waiting for a
 * decision) and Teremnaptár (with the upcoming sessions without a place).
 */
export async function NavTop({ payload, user }: ServerProps) {
  if (!userIsStaffOrAdmin(user)) return null;
  const [waiting, unplaced] = await Promise.all([countWaiting(payload), countUnplaced(payload)]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0 16px' }}>
      <a href="/admin" className="nav__link" style={{ fontWeight: 600 }}>
        Irányítópult
      </a>
      <a href="/admin/jelentkezesek" className="nav__link" style={{ fontWeight: 600 }}>
        Jelentkezések
      </a>
      {waiting > 0 && (
        <a href="/admin/jelentkezesek" className="nav__link" style={badge}>
          Döntésre vár: {waiting}
        </a>
      )}
      <a href="/admin/teremnaptar" className="nav__link" style={{ fontWeight: 600 }}>
        Teremnaptár
      </a>
      {unplaced > 0 && (
        <a href={unplacedListHref()} className="nav__link" style={badge}>
          Helyszín nélkül: {unplaced}
        </a>
      )}
    </div>
  );
}
