import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { ForgotPasswordForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { getUi } from '@/lib/data';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).password.forgotTitle);

export default async function ForgotPasswordPage() {
  const { nav, password: t } = await getUi();
  return (
    <AccountShell eyebrow={nav.eyebrow} heading={t.forgotHeading} intro={<p>{t.forgotIntro}</p>}>
      <Card>
        <ForgotPasswordForm />
      </Card>
    </AccountShell>
  );
}
