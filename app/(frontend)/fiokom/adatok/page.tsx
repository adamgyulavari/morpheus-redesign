import AccountNav from '@/components/account/AccountNav';
import AccountShell, { Card } from '@/components/account/AccountShell';
import { ProfileForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { logout } from '@/lib/account-actions';
import { payloadClient, requireUser } from '@/lib/auth';
import { studentGroups } from '@/lib/rooms/server';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Adataim');

/** Own name and phone, logout. */
export default async function ProfilePage() {
  const user = await requireUser('/fiokom/adatok');
  const { groups } = await studentGroups(await payloadClient(), user.id);
  return (
    <AccountShell eyebrow="Fiókom" heading="*Adataim*" wide>
      <AccountNav active={groups.length > 0} />
      <div className="grid max-w-[640px] gap-5">
        <Card>
          <ProfileForm
            user={{ email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }}
          />
        </Card>
        <form action={logout}>
          <button type="submit" className="link text-[15px] font-semibold">
            Kilépés
          </button>
        </form>
      </div>
    </AccountShell>
  );
}
