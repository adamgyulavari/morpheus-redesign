import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { MagicLinkConfirm } from '@/components/account/forms';
import { accountMetadata } from '@/components/account/meta';
import { payloadClient } from '@/lib/auth';
import { peekMagicLink } from '@/payload/magic-link';

type Props = { searchParams: Promise<{ token?: string; next?: string }> };

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  // the token is in this page's address: don't send it on to other sites
  return { ...(await accountMetadata('Belépés')), referrer: 'no-referrer' };
}

/**
 * The link from the "Belépési link" e-mail. Opening it only shows whose login it is; the button
 * (a POST) logs in. Mail scanners open links, but don't press buttons, so they can't use it up.
 * `next`: where to go afterwards (e.g. /fiokom from an application e-mail).
 */
export default async function MagicLinkPage({ searchParams }: Props) {
  const { token = '', next } = await searchParams;
  const link = await peekMagicLink(await payloadClient(), token);
  if (!link) redirect('/belepes?hiba=link');

  return (
    <AccountShell eyebrow="Fiók" heading="Belépés *egy kattintással*">
      <Card>
        <MagicLinkConfirm token={token} email={link.email} next={next} />
      </Card>
    </AccountShell>
  );
}
