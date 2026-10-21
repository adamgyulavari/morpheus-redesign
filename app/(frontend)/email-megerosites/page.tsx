import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { accountMetadata } from '@/components/account/meta';
import Notice from '@/components/forms/Notice';
import { ButtonLink } from '@/components/ui';
import { payloadClient } from '@/lib/auth';
import { getUi } from '@/lib/data';

type Props = { searchParams: Promise<{ token?: string }> };

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).verify.title);

/** The link from the verification e-mail: verifies the address, then offers the login. */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  let verified = false;
  if (token) {
    try {
      verified = await (await payloadClient()).verifyEmail({ collection: 'users', token });
    } catch {
      verified = false;
    }
  }
  const { nav, verify: t } = await getUi();
  return (
    <AccountShell eyebrow={nav.eyebrow} heading={verified ? t.headingDone : t.heading}>
      <Card>
        {verified ? <Notice message={t.done} /> : <Notice error={t.invalid} />}
        <ButtonLink
          link={{ label: t.login, href: '/belepes' }}
          variant="primary"
          arrow
          className="self-stretch sm:self-start"
        />
      </Card>
    </AccountShell>
  );
}
