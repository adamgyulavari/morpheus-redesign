import Link from 'next/link';
import { notFound } from 'next/navigation';

import AccountShell, { Card } from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import CheckoutForm from '@/components/payments/CheckoutForm';
import { workshopState } from '@/lib/applications/rules';
import { NOBODY, takenBy, workshopFacts, workshopInfo } from '@/lib/applications/server';
import { applicationSettings } from '@/lib/applications/settings';
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { formatHuf } from '@/lib/format';
import { billingSettings, PAUSED } from '@/lib/payments/settings';

// per visitor and per moment (places, holds), never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Jelentkezés és fizetés');

/** /fizetes?session=…: a Nyitott Műhely date — the summary, billing details, terms, then the payment page. */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const id = Number((await searchParams).session);
  const payload = await payloadClient();
  const s = id ? await payload.findByID({ collection: 'sessions', id, depth: 0, disableErrors: true }) : null;
  if (s?.kind !== 'workshop') notFound();
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
  const here = `/fizetes?session=${s.id}`;

  return (
    <AccountShell eyebrow="Jelentkezés" heading="*Nyitott Műhely*">
      <Card>
        <dl className="grid gap-x-6 gap-y-2 text-[16px] sm:grid-cols-[max-content_1fr]">
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
            {state.state === 'open'
              ? `Még ${state.needed} jelentkező kell az induláshoz`
              : state.state === 'confirmed'
                ? 'Biztosan indul'
                : '—'}
            {(state.state === 'open' || state.state === 'confirmed') && state.left != null
              ? ` · ${state.left} szabad hely`
              : ''}
          </dd>
        </dl>
        <div className="flex items-baseline justify-between gap-4 rounded-2xl bg-sand px-5 py-4">
          <span className="text-[15px] font-semibold text-ink2">Részvételi díj</span>
          <span className="font-display text-[32px] leading-none text-ink">{formatHuf(price)}</span>
        </div>
      </Card>

      {!billing.online ? (
        <Card>
          <p className="text-[17px]">
            {PAUSED} Az időpontokra a Nyitott Műhely oldalán jelentkezhetsz; a díjat a helyszínen fizeted.
          </p>
          <Link href="/nyitott-alkalmak/" className="link self-start font-semibold">
            Az időpontok
          </Link>
        </Card>
      ) : open ? (
        <CheckoutForm
          sessionId={s.id}
          price={price}
          loginHref={`/belepes?vissza=${encodeURIComponent(here)}`}
          policy={[
            `Lemondás: legkésőbb ${settings.userCancelHours} órával a kezdés előtt, a fiókodban — a befizetett összeg kreditként marad nálad, és másik alkalomra fordíthatod.`,
            `Ha ${settings.workshopCutoffHours} órával a kezdés előtt nincs legalább ${facts.minParticipants} fizetett jelentkező, az alkalom elmarad: a teljes összeget kreditként jóváírjuk, és egy kattintással áthelyezheted másik időpontra.`,
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
      ) : (
        <Card>
          <p className="text-[17px]">
            {state.state === 'full' ? 'Ez az alkalom megtelt.' : 'Erre az alkalomra már nem lehet jelentkezni.'}
          </p>
          <Link href="/nyitott-alkalmak/" className="link self-start font-semibold">
            A többi időpont
          </Link>
        </Card>
      )}
    </AccountShell>
  );
}
