import Link from 'next/link';
import { redirect } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { LoginForms } from '@/components/account/forms';
import GoogleLogin from '@/components/account/GoogleLogin';
import { accountMetadata } from '@/components/account/meta';
import Notice from '@/components/forms/Notice';
import { getCurrentUser, safeReturnPath } from '@/lib/auth';
import { getUi } from '@/lib/data';

type Props = { searchParams: Promise<{ vissza?: string; hiba?: string }> };

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Belépés');

export default async function LoginPage({ searchParams }: Props) {
  const { vissza, hiba } = await searchParams;
  const returnTo = safeReturnPath(vissza);
  if (await getCurrentUser()) redirect(returnTo);
  const { googleLogin } = await getUi();
  // back from Google (app/(frontend)/belepes/google/callback)
  const googleError =
    hiba === 'google-megszakitva'
      ? googleLogin.cancelled
      : hiba === 'google-email'
        ? googleLogin.unverified
        : hiba === 'google'
          ? googleLogin.failed
          : undefined;

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
        <Notice error="Ez a belépési link érvénytelen, lejárt vagy már felhasználták. Kérj újat, vagy lépj be jelszóval." />
      )}
      {googleError && <Notice error={googleError} />}
      <Card>
        <GoogleLogin returnTo={returnTo} />
        <LoginForms returnTo={returnTo} />
      </Card>
    </AccountShell>
  );
}
