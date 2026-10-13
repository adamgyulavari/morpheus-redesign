import type { ServerProps } from 'payload';

import { countWaiting } from '@/lib/applications/server';
import { userIsStaffOrAdmin } from '@/payload/access';

/** In the admin nav: "Jelentkezések", with the number of course applications waiting for a decision. */
export async function ApplicationsNav({ payload, user }: ServerProps) {
  if (!userIsStaffOrAdmin(user)) return null;
  const waiting = await countWaiting(payload);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '4px 0 4px' }}>
      <a href="/admin/jelentkezesek" className="nav__link" style={{ fontWeight: 600 }}>
        Jelentkezések
      </a>
      {waiting > 0 && (
        <a
          href="/admin/jelentkezesek"
          className="nav__link"
          style={{ fontSize: 13, color: 'var(--theme-warning-500, #f9c86a)' }}
        >
          Döntésre vár: {waiting}
        </a>
      )}
    </div>
  );
}
