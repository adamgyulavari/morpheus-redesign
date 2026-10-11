import Link from 'next/link';
import { redirect } from 'next/navigation';

import AccountShell, { Card } from '@/components/account/AccountShell';
import { LoginForms, Notice } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { getCurrentUser, safeReturnPath } from '@/lib/auth';

type Props = { searchParams: Promise<{ vissza?: string; hiba?: string }> };

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Belépés');

export default async function LoginPage({ searchParams }: Props) {
  const { vissza, hiba } = await searchParams;
  const returnTo = safeReturnPath(vissza);
  if (await getCurrentUser()) redirect(returnTo);

  return (
    <AccountShell
      eyebrow="Fiók"
      heading="*Belépés*"
      intro={
        <p>
          Lépj be a Morpheus-fiókodba. Nincs még fiókod?{' '}
          <Link href="/regisztracio" className="link font-semibold text-ink">
            Regisztrálj
          </Link>
          .
        </p>
      }
    >
      {hiba === 'link' && (
        <Notice
          state={{
            error: 'Ez a belépési link érvénytelen, lejárt vagy már felhasználták. Kérj újat, vagy lépj be jelszóval.',
          }}
        />
      )}
      <Card>
        <LoginForms returnTo={returnTo} />
      </Card>
    </AccountShell>
  );
}
