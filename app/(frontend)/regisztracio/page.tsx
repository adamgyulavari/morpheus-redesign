import { redirect } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { RegisterForm } from '@/components/account/forms';
import GoogleLogin from '@/components/account/GoogleLogin';
import { accountMetadata } from '@/components/account/meta';
import { getCurrentUser } from '@/lib/auth';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Regisztráció');

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/fiokom');
  return (
    <AccountShell
      eyebrow="Fiók"
      heading="*Regisztráció*"
      intro={
        <p>
          Hozd létre a Morpheus-fiókodat. A regisztráció után küldünk egy levelet: a benne lévő linkkel erősítsd meg az
          e-mail-címed.
        </p>
      }
    >
      <Card>
        <GoogleLogin />
        <RegisterForm />
      </Card>
    </AccountShell>
  );
}
