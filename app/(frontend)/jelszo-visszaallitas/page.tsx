import AccountShell, { Card } from '@/components/account/AccountShell';
import { Notice, ResetPasswordForm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { ButtonLink } from '@/components/ui';

type Props = { searchParams: Promise<{ token?: string }> };

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Új jelszó');

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <AccountShell
      eyebrow="Fiók"
      heading="Új *jelszó*"
      intro={token ? <p>Add meg az új jelszavad. Mentés után be is léptetünk.</p> : undefined}
    >
      <Card>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <>
            <Notice
              state={{ error: 'Hiányzik a visszaállító kód. Nyisd meg újra a levélben kapott linket, vagy kérj újat.' }}
            />
            <ButtonLink
              link={{ label: 'Új link kérése', href: '/elfelejtett-jelszo' }}
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
