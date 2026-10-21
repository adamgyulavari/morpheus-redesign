import AccountNav from '@/components/account/AccountNav';
import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { BillingForm, ProfileForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { requireUser } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { billingOf } from '@/lib/payments/me';
import { mayBookRooms } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Adataim');

/** Own name and phone; the billing details for invoices. */
export default async function ProfilePage() {
  const user = await requireUser('/fiokom/adatok');
  const { googleLogin } = await getUi();
  return (
    <AccountShell eyebrow="Fiókom" heading="*Adataim*" wide>
      <AccountNav canBook={mayBookRooms(user)} isStaff={userIsStaffOrAdmin(user)} />
      <div className="grid max-w-[640px] gap-5">
        <Card>
          <ProfileForm
            user={{ email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }}
            google={user.googleSub ? googleLogin.linked : undefined}
          />
        </Card>
        <Card>
          <BillingForm billing={billingOf(user)} />
        </Card>
      </div>
    </AccountShell>
  );
}
