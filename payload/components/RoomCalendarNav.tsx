import type { ServerProps } from 'payload';

import { countUnplaced } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';

/**
 * In the admin nav: "Teremnaptár", and the number of upcoming sessions without a place, linking to
 * them ("Helyszín nélkül": the sessions list filtered to upcoming unplaced ones).
 */
export async function RoomCalendarNav({ payload, user }: ServerProps) {
  if (!userIsStaffOrAdmin(user)) return null;
  const unplaced = await countUnplaced(payload);
  const now = new Date().toISOString();
  const list = `/admin/collections/sessions?where[and][0][locationType][equals]=unplaced&where[and][1][status][equals]=scheduled&where[and][2][start][greater_than]=${encodeURIComponent(now)}&sort=start`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0 4px' }}>
      <a href="/admin/teremnaptar" className="nav__link" style={{ fontWeight: 600 }}>
        Teremnaptár
      </a>
      {unplaced > 0 && (
        <a href={list} className="nav__link" style={{ fontSize: 13, color: 'var(--theme-warning-500, #f9c86a)' }}>
          Helyszín nélkül: {unplaced}
        </a>
      )}
    </div>
  );
}
