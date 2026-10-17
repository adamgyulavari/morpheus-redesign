import { NavGroup } from '@payloadcms/ui';
import type { ServerProps } from 'payload';

import { unplacedListHref } from '@/lib/admin/home';
import { countWaiting } from '@/lib/applications/server';
import { countUnplaced } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';
import { DAILY } from '@/payload/nav';

const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } as const;

/** A count next to a link: amber pill, its own link (the meaning in the tooltip). */
function Badge({ count, href, title }: { count: number; href: string; title: string }) {
  if (!count) return null;
  return (
    <a
      href={href}
      title={title}
      aria-label={title}
      style={{
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        borderRadius: 999,
        background: '#f9c86a',
        color: '#0b3a3f',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: '20px',
        textAlign: 'center',
        textDecoration: 'none',
      }}
    >
      {count}
    </a>
  );
}

/**
 * Above the sidebar's groups: Irányítópult, then the "Napi munka" group — Jelentkezések (badge: the
 * applications waiting for a decision), Teremnaptár (badge: the upcoming sessions without a place)
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
        <span style={row}>
          <a href="/admin/jelentkezesek" className="nav__link">
            Jelentkezések
          </a>
          <Badge count={waiting} href="/admin/jelentkezesek" title={`Döntésre vár: ${waiting}`} />
        </span>
        <span style={row}>
          <a href="/admin/teremnaptar" className="nav__link">
            Teremnaptár
          </a>
          <Badge count={unplaced} href={unplacedListHref()} title={`Helyszín nélkül: ${unplaced} alkalom`} />
        </span>
        {collections.map((c) => (
          <a key={c.slug} href={`/admin/collections/${c.slug}`} className="nav__link">
            {c.label}
          </a>
        ))}
      </NavGroup>
    </>
  );
}
