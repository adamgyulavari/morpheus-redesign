import Link from 'next/link';
import { redirect } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { LoginForms } from '@/components/account/forms';
import GoogleLogin from '@/components/account/GoogleLogin';
import { accountMetadata } from '@/components/account/meta';
import Notice from '@/components/forms/Notice';
import { tagged } from '@/components/tagged';
import { getCurrentUser, safeReturnPath } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { googleErrorText } from '@/lib/google/round-trip';

type Props = { searchParams: Promise<{ vissza?: string; hiba?: string }> };

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).login.title);

export default async function LoginPage({ searchParams }: Props) {
  const { vissza, hiba } = await searchParams;
  const returnTo = safeReturnPath(vissza);
  if (await getCurrentUser()) redirect(returnTo);
  const { googleLogin, login: t, nav } = await getUi();
  // back from Google (app/(frontend)/belepes/google/callback)
  const googleError = googleErrorText(hiba, googleLogin);

  return (
    <AccountShell
      eyebrow={nav.eyebrow}
      heading={t.heading}
      intro={
        <p>
          {tagged(t.intro, {
            link: (chunk) => (
              <Link href="/regisztracio" className="link font-semibold text-ink">
                {chunk}
              </Link>
            ),
          })}
        </p>
      }
    >
      {hiba === 'link' && <Notice error={t.linkInvalid} />}
      {googleError && <Notice error={googleError} />}
      <Card>
        <GoogleLogin returnTo={returnTo} />
        <LoginForms returnTo={returnTo} />
      </Card>
    </AccountShell>
  );
}
