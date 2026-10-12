import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { RichText } from '@payloadcms/richtext-lexical/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import AccountNav from '@/components/account/AccountNav';
import AccountShell, { Card } from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import { ArrowRight } from '@/components/icons';
import { payloadClient, requireUser } from '@/lib/auth';
import { dateRange } from '@/lib/dates';
import { whenText } from '@/lib/rooms/format';
import { SESSION_KINDS } from '@/lib/rooms/labels';
import { studentOverview } from '@/lib/rooms/student';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Fiókom');

const day = (iso: string) => iso.slice(0, 10);

/** The first name; accounts migrated from a one-word name have "-" there (then the whole name). */
const greetingName = (u: { firstName?: string | null; name?: string | null }) =>
  u.firstName && u.firstName !== '-' ? u.firstName : (u.name ?? '');

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-[32px] leading-none lg:text-[40px]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-[15px] text-muted">{children}</p>;

/**
 * The student area's overview. Left: what's coming — the sessions of my groups and their productions,
 * with my groupmates' practice (marked, quieter) in between. Right: my courses, my own bookings,
 * links. Fresh on every request.
 * Phase 3 adds "Foglalásaim" and "Számláim" sections (and tabs) here.
 */
export default async function AccountPage() {
  const user = await requireUser('/fiokom');
  const o = await studentOverview(await payloadClient(), user);
  // the group's sessions and the groupmates' practice, in one chronological list
  const agenda = [
    ...o.sessions.map((s) => ({ type: 'session' as const, start: s.start, s })),
    ...o.groupPractice.map((b) => ({ type: 'practice' as const, start: b.start, b })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <AccountShell eyebrow="Fiókom" heading={`Szia, *${greetingName(user)}!*`} wide>
      <AccountNav canBook={o.mayBook} isStaff={userIsStaffOrAdmin(user)} />

      {!o.active ? (
        <Card>
          <p className="text-[16px] leading-relaxed text-ink2">
            Most nem vagy egyik futó csoportunkban sem. Ha jelentkeztél egy kurzusra, a felvételed után itt találod az
            időpontokat és a tudnivalókat.{' '}
            {o.mayBook && (
              <>
                Termet a{' '}
                <Link href="/fiokom/terem" className="link font-semibold text-ink">
                  Teremfoglalás
                </Link>{' '}
                fülön foglalhatsz.{' '}
              </>
            )}
            Az adataidat az{' '}
            <Link href="/fiokom/adatok" className="link font-semibold text-ink">
              Adataim
            </Link>{' '}
            fülön módosíthatod.
          </p>
        </Card>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Section title="Közelgő alkalmak">
            {agenda.length === 0 ? (
              <Empty>Még nincs kiírt alkalom.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-line self-start rounded-3xl border border-line bg-paper">
                {agenda.map((a) =>
                  a.type === 'session' ? (
                    <li key={`s${a.s.id}`} className="flex flex-col gap-1 px-5 py-4 lg:px-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`font-semibold ${a.s.status === 'cancelled' ? 'text-muted line-through' : 'text-ink'}`}
                        >
                          {a.s.title}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-teal">
                          {a.s.status === 'cancelled' ? 'Elmarad' : SESSION_KINDS[a.s.kind]}
                        </span>
                      </div>
                      <span className="text-[15px] text-ink2">
                        {whenText(a.s.start, a.s.end, 'long')} ·{' '}
                        {a.s.place ?? <em className="not-italic text-muted">helyszín egyeztetés alatt</em>}
                      </span>
                    </li>
                  ) : (
                    // a groupmate's practice: optional, so quieter than the group's own dates
                    <li key={`p${a.b.id}`} className="flex flex-col gap-1 bg-cream/60 px-5 py-3 lg:px-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[15px] text-ink2">Gyakorlás — {a.b.booker}</span>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Gyakorlás</span>
                      </div>
                      <span className="text-[14px] text-muted">
                        {whenText(a.b.start, a.b.end, 'long')} · {a.b.rooms}
                        {a.b.owner && ` · ${a.b.owner}`}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            )}
          </Section>

          <div className="flex flex-col gap-10">
            <Section title="Kurzusaim">
              {o.groups.map((g) => (
                <Card key={g.id}>
                  <h3 className="font-display text-[26px] leading-tight lg:text-[30px]">{g.title}</h3>
                  <p className="text-[15px] font-semibold text-teal">
                    {dateRange(day(g.startDate), day(g.endDate))}
                    {g.instructors.length > 0 && (
                      <span className="font-normal text-ink2"> · {g.instructors.join(', ')}</span>
                    )}
                  </p>
                  {g.info && (
                    <div className="text-[16px] leading-[1.7] text-ink2 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-[24px] [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-bold [&_h3]:text-ink [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_strong]:font-bold [&_strong]:text-ink [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6">
                      <RichText data={g.info as SerializedEditorState} disableContainer />
                    </div>
                  )}
                </Card>
              ))}
            </Section>

            <Section
              title="Saját foglalásaim"
              action={
                <Link href="/fiokom/terem" className="link-arrow link text-[15px] text-teal">
                  Terem foglalása
                  <ArrowRight />
                </Link>
              }
            >
              {o.ownPractice.length === 0 ? (
                <Empty>Nincs közelgő teremfoglalásod.</Empty>
              ) : (
                <ul className="flex flex-col gap-2">
                  {o.ownPractice.map((b) => (
                    <li key={b.id} className="rounded-2xl border border-line bg-paper px-4 py-3 text-[15px]">
                      <span className="font-semibold text-ink">{whenText(b.start, b.end)}</span>
                      <span className="text-ink2">
                        {' '}
                        · {b.rooms}
                        {b.owner && ` · ${b.owner}`}
                      </span>
                      {b.note && <span className="mt-1 block text-[14px] italic text-muted">„{b.note}”</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {o.links.length > 0 && (
              <Section title="Linkek">
                <ul className="flex flex-col gap-2">
                  {o.links.map((l) => (
                    <li key={l.id}>
                      <a href={l.url} className="link-arrow link text-[16px] text-ink" target="_blank" rel="noopener">
                        {l.title}
                        <ArrowRight />
                      </a>
                      {l.description && <p className="text-[14px] text-muted">{l.description}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        </div>
      )}
    </AccountShell>
  );
}
