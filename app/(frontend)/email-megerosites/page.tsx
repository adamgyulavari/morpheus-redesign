import AccountShell, { Card } from '@/components/account/AccountShell';
import { Notice } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { ButtonLink } from '@/components/ui';
import { payloadClient } from '@/lib/auth';

type Props = { searchParams: Promise<{ token?: string }> };

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('E-mail-cím megerősítése');

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
  return (
    <AccountShell eyebrow="Fiók" heading={verified ? 'Megerősítve, *köszönjük!*' : 'E-mail-cím *megerősítése*'}>
      <Card>
        {verified ? (
          <Notice info="Az e-mail-címed megerősítve. Most már be tudsz lépni." />
        ) : (
          <Notice
            state={{
              error:
                'Ez a megerősítő link érvénytelen vagy már felhasználták. Ha korábban már megerősítetted a címed, egyszerűen lépj be.',
            }}
          />
        )}
        <ButtonLink
          link={{ label: 'Belépés', href: '/belepes' }}
          variant="primary"
          arrow
          className="self-stretch sm:self-start"
        />
      </Card>
    </AccountShell>
  );
}
