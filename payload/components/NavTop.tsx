import { NavGroup } from '@payloadcms/ui';
import type { ServerProps } from 'payload';

import { unplacedListHref } from '@/lib/admin/home';
import { countWaiting } from '@/lib/applications/server';
import { countUnplaced } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';
import { DAILY } from '@/payload/nav';

const badge = { fontSize: 13, color: 'var(--theme-warning-500, #f9c86a)' } as const;

/**
 * Above the sidebar's groups: Irányítópult, then the "Napi munka" group — Jelentkezések (with the
 * applications waiting for a decision), Teremnaptár (with the upcoming sessions without a place)
 * and the collections in DAILY (payload/nav.ts).
 */
export async function NavTop({ payload, user }: ServerProps) {
  if (!userIsStaffOrAdmin(user)) return null;
  const [waiting, unplaced] = await Promise.all([countWaiting(payload), countUnplaced(payload)]);
  const collections = DAILY.flatMap((slug) => {
    const c = payload.collections[slug as keyof typeof payload.collections]?.config;
    const label = c?.labels.plural;
    return c && typeof label === 'string' ? [{ slug, label }] : [];
  });
  return (
    <>
      <a href="/admin" className="nav__link" style={{ fontWeight: 600, margin: '12px 0 16px' }}>
        Irányítópult
      </a>
      <NavGroup label="Napi munka">
        <a href="/admin/jelentkezesek" className="nav__link">
          Jelentkezések
        </a>
        {waiting > 0 && (
          <a href="/admin/jelentkezesek" className="nav__link" style={badge}>
            Döntésre vár: {waiting}
          </a>
        )}
        <a href="/admin/teremnaptar" className="nav__link">
          Teremnaptár
        </a>
        {unplaced > 0 && (
          <a href={unplacedListHref()} className="nav__link" style={badge}>
            Helyszín nélkül: {unplaced}
          </a>
        )}
        {collections.map((c) => (
          <a key={c.slug} href={`/admin/collections/${c.slug}`} className="nav__link">
            {c.label}
          </a>
        ))}
      </NavGroup>
    </>
  );
}
