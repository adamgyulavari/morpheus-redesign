import { notFound } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import CheckoutForm from '@/components/payments/CheckoutForm';
import CheckoutNotice from '@/components/payments/CheckoutNotice';
import CheckoutSummary from '@/components/payments/CheckoutSummary';
import { workshopState } from '@/lib/applications/rules';
import { NOBODY, takenBy, workshopFacts, workshopInfo } from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { fill } from '@/lib/format';
import { checkoutAction } from '@/lib/payments/actions';
import { checkoutPath } from '@/lib/payments/links';
import { checkoutMe } from '@/lib/payments/me';
import { paymentProvider } from '@/lib/payments/providers';
import { billingSettings } from '@/lib/payments/settings';
import { sessionByCode } from '@/lib/payments/target';
import type { Session } from '@/payload-types';

// per visitor and per moment (places, holds), never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).checkout.title);

/** /fizetes?alkalom=<code>: a Nyitott Műhely date — your details on the left, the order and payment on the right. */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ alkalom?: string }> }) {
  const payload = await payloadClient();
  const s = await sessionByCode(payload, (await searchParams).alkalom ?? '');
  if (!s?.code) notFound();
  const { checkout: t } = await getUi();
  return (
    <AccountShell eyebrow={t.eyebrow} heading={t.workshop} wide>
      <Body session={s} code={s.code} />
    </AccountShell>
  );
}

async function Body({ session: s, code }: { session: Session; code: string }) {
  const payload = await payloadClient();
  const [viewer, settings, billing, taken, ui] = await Promise.all([
    getCurrentUser(),
    applicationSettings(payload),
    billingSettings(payload),
    takenBy(payload, 'session_id', [s.id]),
    getUi(),
  ]);
  const t = ui.checkout;
  const otherDates = { href: '/nyitott-alkalmak/', label: t.otherDates };
  if (!billing.online) return <CheckoutNotice text={t.pausedWorkshop} back={otherDates} />;

  const facts = workshopFacts(s, taken.get(s.id) ?? NOBODY);
  const state = workshopState(facts, new Date(), settings);
  if (state.state === 'full') return <CheckoutNotice text={t.full} back={otherDates} />;
  if (state.state !== 'open' && state.state !== 'confirmed')
    return <CheckoutNotice text={t.closed} back={otherDates} />;

  const info = await workshopInfo(payload, s, settings);
  const needs = state.state === 'open' ? fill(ui.sessions.needed, { count: state.needed }) : ui.sessions.confirmed;
  return (
    <CheckoutForm
      kind="workshop"
      action={checkoutAction}
      hidden={{ alkalom: code }}
      price={Math.max(0, s.workshop?.price ?? 0)}
      loginHref={`/belepes?vissza=${encodeURIComponent(checkoutPath(code))}`}
      provider={paymentProvider().brand}
      summary={
        <CheckoutSummary
          title={info.when ?? info.title}
          lines={info.place ? [info.place] : []}
          meta={[needs, state.left != null ? fill(ui.sessions.left, { count: state.left }) : '']
            .filter(Boolean)
            .join(' · ')}
        />
      }
      policy={[
        fill(t.policyCancel, { hours: settings.userCancelHours }),
        fill(t.policyCutoff, { hours: settings.workshopCutoffHours, min: facts.minParticipants }),
      ]}
      me={checkoutMe(viewer)}
    />
  );
}
