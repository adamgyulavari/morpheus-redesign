import type { ServerProps } from 'payload';
import { KIND_PALETTE } from '@/lib/rooms/labels';
import { userIsStaffOrAdmin } from '@/payload/access';
import s from './home.module.css';
import { homeData } from './home-data';

const QUICK = [
  { label: 'Hónap feltöltése', href: '/admin/teremnaptar?feltoltes=honap' },
  { label: 'Új előadás-időpont', href: '/admin/collections/shows/create' },
  { label: 'Új oldal', href: '/admin/collections/pages/create' },
];

/** Above the admin's card grid: quick actions, then what needs doing and the coming week. Staff only. */
export async function Home({ payload, user }: ServerProps) {
  if (!userIsStaffOrAdmin(user)) return null;
  const { todos, fill, week } = await homeData(payload);
  return (
    <div className={s.home}>
      <nav className={s.quick} aria-label="Gyors műveletek">
        {QUICK.map((q) => (
          <a key={q.href} href={q.href} className={s.btn}>
            {q.label}
          </a>
        ))}
      </nav>

      <section className={s.panel} aria-labelledby="home-todo">
        <h2 id="home-todo">Teendők</h2>
        {todos.length === 0 && !fill ? (
          <p className={s.muted}>Nincs teendő. ✓</p>
        ) : (
          <ul className={s.todos}>
            {todos.map((t) => (
              <li key={t.text}>
                <a href={t.href} className={`${s.todo} ${t.tone === 'warn' ? s.warn : s.info}`}>
                  <span className={s.mark} aria-hidden>
                    {t.tone === 'warn' ? '!' : 'i'}
                  </span>
                  {t.text}
                </a>
              </li>
            ))}
            {fill && (
              <li>
                <a href="/admin/teremnaptar?feltoltes=honap" className={`${s.todo} ${s.info}`}>
                  <span className={s.mark} aria-hidden>
                    +
                  </span>
                  {fill.month[0]?.toUpperCase()}
                  {fill.month.slice(1)}: {fill.count} alkalom még nincs létrehozva — Hónap feltöltése
                </a>
              </li>
            )}
          </ul>
        )}
      </section>

      <section className={s.panel} aria-labelledby="home-week">
        <h2 id="home-week">
          A héten <a href="/admin/teremnaptar">Teremnaptár →</a>
        </h2>
        {week.length === 0 && <p className={s.muted}>A következő hét napban nincs alkalom.</p>}
        {week.map((d) => (
          <div key={d.day} className={s.day}>
            <h3>
              {d.label} <span>{d.date}</span>
            </h3>
            <ul>
              {d.items.map((i) => (
                <li key={`${i.time}${i.title}`} className={i.cancelled ? s.cancelled : undefined}>
                  <span className={s.dot} style={{ background: KIND_PALETTE[i.kind].fill }} aria-hidden />
                  <span className={s.time}>{i.time}</span>
                  {/* one line: the place after the title, cut short when there's no room */}
                  <span className={s.what} title={[i.title, i.place].filter(Boolean).join(' · ')}>
                    {i.title}
                    {i.cancelled ? ' (elmarad)' : ''}
                    {i.place && <span className={s.place}> · {i.place}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
