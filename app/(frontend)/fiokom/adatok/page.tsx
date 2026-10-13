import AccountNav from '@/components/account/AccountNav';
import AccountShell, { Card } from '@/components/account/AccountShell';
import { ProfileForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { requireUser } from '@/lib/auth';
import { mayBookRooms } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Adataim');

/** Own name and phone. */
export default async function ProfilePage() {
  const user = await requireUser('/fiokom/adatok');
  return (
    <AccountShell eyebrow="Fiókom" heading="*Adataim*" wide>
      <AccountNav canBook={mayBookRooms(user)} isStaff={userIsStaffOrAdmin(user)} />
      <div className="grid max-w-[640px] gap-5">
        <Card>
          <ProfileForm
            user={{ email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }}
          />
        </Card>
      </div>
    </AccountShell>
  );
}
