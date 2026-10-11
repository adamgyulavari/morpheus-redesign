import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { RichText } from '@payloadcms/richtext-lexical/react';

import AccountShell, { Card } from '@/components/account/AccountShell';
import { ProfileForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { ArrowRight } from '@/components/icons';
import { logout } from '@/lib/account-actions';
import { payloadClient, requireUser } from '@/lib/auth';
import { dateRange, todayInBudapest } from '@/lib/dates';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Fiókom');

const day = (iso: string) => iso.slice(0, 10);

function status(start: string, end: string): { label: string; className: string } {
  const today = todayInBudapest();
  if (end < today) return { label: 'Lezárult', className: 'bg-sand text-muted' };
  if (start > today) return { label: 'Hamarosan indul', className: 'bg-gold/40 text-ink' };
  return { label: 'Folyamatban', className: 'bg-teal text-cream' };
}

/** The logged-in user's page: own data, own course groups, logout. Fresh on every request. */
export default async function AccountPage() {
  const user = await requireUser('/fiokom');
  const payload = await payloadClient();
  // the groups this user is a student of (staff could read all groups; this lists only their own),
  // without the student list
  const { docs: groups } = await payload.find({
    collection: 'courseGroups',
    where: { students: { in: [user.id] } },
    select: { title: true, startDate: true, endDate: true, info: true },
    sort: '-startDate',
    depth: 0,
    limit: 50,
  });

  return (
    <AccountShell eyebrow="Fiókom" heading={`Szia, *${user.firstName}!*`} wide>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <div className="flex flex-col gap-5">
          <h2 className="font-display text-[36px] leading-none lg:text-[48px]">Kurzusaim</h2>
          {groups.length === 0 ? (
            <Card>
              <p className="text-[16px] leading-relaxed text-ink2">
                Még nem vagy egyik csoportunkban sem. Ha jelentkeztél egy kurzusra, a felvételed után itt találod az
                időpontokat és a tudnivalókat.
              </p>
            </Card>
          ) : (
            groups.map((g) => {
              const s = status(day(g.startDate), day(g.endDate));
              return (
                <Card key={g.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-[28px] leading-tight lg:text-[34px]">{g.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${s.className}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="text-[15px] font-semibold text-teal">{dateRange(day(g.startDate), day(g.endDate))}</p>
                  {g.info && (
                    <div className="text-[16px] leading-[1.7] text-ink2 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-[26px] [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-bold [&_h3]:text-ink [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_strong]:font-bold [&_strong]:text-ink [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6">
                      <RichText data={g.info as SerializedEditorState} disableContainer />
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <ProfileForm
              user={{ email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }}
            />
          </Card>
          {userIsStaffOrAdmin(user) && (
            <a href="/admin" className="btn btn-lg btn-outline self-stretch sm:self-start">
              Admin felület
              <ArrowRight />
            </a>
          )}
          <form action={logout}>
            <button type="submit" className="link text-[15px] font-semibold">
              Kilépés
            </button>
          </form>
        </div>
      </div>
    </AccountShell>
  );
}
