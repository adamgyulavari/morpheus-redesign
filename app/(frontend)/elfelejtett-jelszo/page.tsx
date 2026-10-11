import AccountShell, { Card } from '@/components/account/AccountShell';
import { ForgotPasswordForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Elfelejtett jelszó');

export default function ForgotPasswordPage() {
  return (
    <AccountShell
      eyebrow="Fiók"
      heading="Elfelejtett *jelszó*"
      intro={<p>Add meg a fiókodhoz tartozó e-mail-címet, és küldünk egy linket, amellyel új jelszót állíthatsz be.</p>}
    >
      <Card>
        <ForgotPasswordForm />
      </Card>
    </AccountShell>
  );
}
