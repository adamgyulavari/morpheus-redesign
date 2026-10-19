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
import { checkoutAction } from '@/lib/payments/actions';
import { checkoutPath } from '@/lib/payments/links';
import { checkoutMe } from '@/lib/payments/me';
import { paymentProvider } from '@/lib/payments/providers';
import { billingSettings, PAUSED } from '@/lib/payments/settings';
import { sessionByCode } from '@/lib/payments/target';
import type { Session } from '@/payload-types';

// per visitor and per moment (places, holds), never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Jelentkezés és fizetés');

const OTHER_DATES = { href: '/nyitott-alkalmak/', label: 'A többi időpont' };

/** /fizetes?alkalom=<code>: a Nyitott Műhely date — your details on the left, the order and payment on the right. */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ alkalom?: string }> }) {
  const payload = await payloadClient();
  const s = await sessionByCode(payload, (await searchParams).alkalom ?? '');
  if (!s?.code) notFound();
  return (
    <AccountShell eyebrow="Jelentkezés" heading="*Nyitott Műhely*" wide>
      <Body session={s} code={s.code} />
    </AccountShell>
  );
}

async function Body({ session: s, code }: { session: Session; code: string }) {
  const payload = await payloadClient();
  const [viewer, settings, billing, taken] = await Promise.all([
    getCurrentUser(),
    applicationSettings(payload),
    billingSettings(payload),
    takenBy(payload, 'session_id', [s.id]),
  ]);
  if (!billing.online)
    return (
      <CheckoutNotice
        text={`${PAUSED} Az időpontokra a Nyitott Műhely oldalán jelentkezhetsz; a díjat a helyszínen fizeted.`}
        back={OTHER_DATES}
      />
    );

  const facts = workshopFacts(s, taken.get(s.id) ?? NOBODY);
  const state = workshopState(facts, new Date(), settings);
  if (state.state === 'full') return <CheckoutNotice text="Ez az alkalom megtelt." back={OTHER_DATES} />;
  if (state.state !== 'open' && state.state !== 'confirmed')
    return <CheckoutNotice text="Erre az alkalomra már nem lehet jelentkezni." back={OTHER_DATES} />;

  const info = await workshopInfo(payload, s, settings);
  const needs = state.state === 'open' ? `Még ${state.needed} jelentkező kell az induláshoz` : 'Biztosan indul';
  return (
    <CheckoutForm
      action={checkoutAction}
      hidden={{ alkalom: code }}
      price={Math.max(0, s.workshop?.price ?? 0)}
      loginHref={`/belepes?vissza=${encodeURIComponent(checkoutPath(code))}`}
      provider={paymentProvider().brand}
      summary={
        <CheckoutSummary
          title={info.when ?? info.title}
          lines={info.place ? [info.place] : []}
          meta={[needs, state.left != null ? `${state.left} szabad hely` : ''].filter(Boolean).join(' · ')}
        />
      }
      policy={[
        `Legkésőbb ${settings.userCancelHours} órával a kezdés előtt a fiókodban áthelyezheted a jelentkezésed egy másik időpontra, vagy lemondhatod. Lemondás esetén a díjat nem térítjük vissza.`,
        `Ha ${settings.workshopCutoffHours} órával a kezdés előtt nincs legalább ${facts.minParticipants} fizetett jelentkező, az alkalom elmarad; a jelentkezésed a fiókodban áthelyezheted egy másik időpontra.`,
      ]}
      me={checkoutMe(viewer)}
    />
  );
}
