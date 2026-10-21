import { redirect } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { RegisterForm } from '@/components/account/forms';
import GoogleLogin from '@/components/account/GoogleLogin';
import { accountMetadata } from '@/components/account/meta';
import { getCurrentUser } from '@/lib/auth';
import { getUi } from '@/lib/data';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).register.title);

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/fiokom');
  const { nav, register: t } = await getUi();
  return (
    <AccountShell eyebrow={nav.eyebrow} heading={t.heading} intro={<p>{t.intro}</p>}>
      <Card>
        <GoogleLogin />
        <RegisterForm />
      </Card>
    </AccountShell>
  );
}
