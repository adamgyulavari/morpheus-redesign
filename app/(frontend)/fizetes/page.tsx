import Link from 'next/link';
import { notFound } from 'next/navigation';

import AccountShell, { Card } from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import CheckoutForm from '@/components/payments/CheckoutForm';
import { workshopState } from '@/lib/applications/rules';
import { NOBODY, takenBy, workshopFacts, workshopInfo } from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { checkoutPath } from '@/lib/payments/links';
import { paymentProvider } from '@/lib/payments/providers';
import { sessionByCode } from '@/lib/payments/service';
import { billingSettings, PAUSED } from '@/lib/payments/settings';

// per visitor and per moment (places, holds), never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Jelentkezés és fizetés');

/** /fizetes?alkalom=<code>: a Nyitott Műhely date — your details on the left, the order and payment on the right. */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ alkalom?: string }> }) {
  const payload = await payloadClient();
  const s = await sessionByCode(payload, (await searchParams).alkalom ?? '');
  if (!s?.code) notFound();
  const [viewer, settings, billing] = await Promise.all([
    getCurrentUser(),
    applicationSettings(payload),
    billingSettings(payload),
  ]);
  const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
  const facts = workshopFacts(s, taken);
  const state = workshopState(facts, new Date(), settings);
  const info = await workshopInfo(payload, s, settings);
  const price = Math.max(0, s.workshop?.price ?? 0);
  const open = state.state === 'open' || state.state === 'confirmed';

  const notice = (text: string) => (
    <Card className="max-w-[680px]">
      <p className="text-[17px]">{text}</p>
      <Link href="/nyitott-alkalmak/" className="link self-start font-semibold">
        A többi időpont
      </Link>
    </Card>
  );

  return (
    <AccountShell eyebrow="Jelentkezés" heading="*Nyitott Műhely*" wide>
      {!billing.online ? (
        notice(`${PAUSED} Az időpontokra a Nyitott Műhely oldalán jelentkezhetsz; a díjat a helyszínen fizeted.`)
      ) : !open ? (
        notice(state.state === 'full' ? 'Ez az alkalom megtelt.' : 'Erre az alkalomra már nem lehet jelentkezni.')
      ) : (
        <CheckoutForm
          code={s.code}
          price={price}
          loginHref={`/belepes?vissza=${encodeURIComponent(checkoutPath(s.code))}`}
          provider={paymentProvider().brand}
          summary={
            <dl className="grid gap-x-5 gap-y-2 text-[15.5px] sm:grid-cols-[max-content_1fr]">
              <dt className="font-semibold text-ink2">Mikor</dt>
              <dd>{info.when}</dd>
              {info.place && (
                <>
                  <dt className="font-semibold text-ink2">Hol</dt>
                  <dd>{info.place}</dd>
                </>
              )}
              <dt className="font-semibold text-ink2">Létszám</dt>
              <dd>
                {state.state === 'open' ? `Még ${state.needed} jelentkező kell az induláshoz` : 'Biztosan indul'}
                {state.left != null ? ` · ${state.left} szabad hely` : ''}
              </dd>
            </dl>
          }
          policy={[
            `Legkésőbb ${settings.userCancelHours} órával a kezdés előtt a fiókodban áthelyezheted a jelentkezésed egy másik időpontra, vagy lemondhatod. Lemondás esetén a díjat nem térítjük vissza.`,
            `Ha ${settings.workshopCutoffHours} órával a kezdés előtt nincs legalább ${facts.minParticipants} fizetett jelentkező, az alkalom elmarad; a jelentkezésed a fiókodban áthelyezheted egy másik időpontra.`,
          ]}
          me={
            viewer
              ? {
                  name: [viewer.lastName, viewer.firstName].filter(Boolean).join(' '),
                  email: viewer.email,
                  phone: viewer.phone ?? '',
                  billing: {
                    billingName: viewer.billing?.name || [viewer.lastName, viewer.firstName].filter(Boolean).join(' '),
                    zip: viewer.billing?.zip ?? '',
                    city: viewer.billing?.city ?? '',
                    address: viewer.billing?.address ?? '',
                    country: viewer.billing?.country || 'HU',
                    taxNumber: viewer.billing?.taxNumber ?? '',
                  },
                }
              : null
          }
        />
      )}
    </AccountShell>
  );
}
