import AccountNav from '@/components/account/AccountNav';
import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { BillingForm, ProfileForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { requireUser } from '@/lib/auth';
import { mayBookRooms } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Adataim');

/** Own name and phone; the billing details for invoices. */
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
        <Card>
          <BillingForm
            billing={{
              name: user.billing?.name || [user.lastName, user.firstName].filter(Boolean).join(' '),
              zip: user.billing?.zip ?? '',
              city: user.billing?.city ?? '',
              address: user.billing?.address ?? '',
              country: user.billing?.country || 'HU',
              taxNumber: user.billing?.taxNumber ?? '',
            }}
          />
        </Card>
      </div>
    </AccountShell>
  );
}
