import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { ResetPasswordForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import Notice from '@/components/forms/Notice';
import { ButtonLink } from '@/components/ui';
import { getUi } from '@/lib/data';

type Props = { searchParams: Promise<{ token?: string }> };

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).password.resetTitle);

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const { nav, password: t } = await getUi();
  return (
    <AccountShell eyebrow={nav.eyebrow} heading={t.resetHeading} intro={token ? <p>{t.resetIntro}</p> : undefined}>
      <Card>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <>
            <Notice error={t.missing} />
            <ButtonLink
              link={{ label: t.newLink, href: '/elfelejtett-jelszo' }}
              variant="primary"
              arrow
              className="self-stretch sm:self-start"
            />
          </>
        )}
      </Card>
    </AccountShell>
  );
}
