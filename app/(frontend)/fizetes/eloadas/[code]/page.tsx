import { notFound } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import CheckoutForm from '@/components/payments/CheckoutForm';
import CheckoutNotice from '@/components/payments/CheckoutNotice';
import CheckoutSummary from '@/components/payments/CheckoutSummary';
import { ticketText } from '@/components/ShowButton';
import { showState } from '@/lib/applications/rules';
import { seatsTaken, showByCode, showFacts, ticketPrice } from '@/lib/applications/shows';
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { showDateLine } from '@/lib/dates';
import { fill } from '@/lib/format';
import { showCheckoutAction } from '@/lib/payments/actions';
import { showCheckoutPath } from '@/lib/payments/links';
import { checkoutMe } from '@/lib/payments/me';
import { paymentProvider } from '@/lib/payments/providers';
import { billingSettings, PAUSED } from '@/lib/payments/settings';

// per visitor and per moment (seats, holds), never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).showBooking.title);

type Props = { params: Promise<{ code: string }> };

/** /fizetes/eloadas/<code>: tickets for a show booked on the site — your details, how many, payment. */
export default async function ShowCheckoutPage({ params }: Props) {
  const payload = await payloadClient();
  const s = await showByCode(payload, (await params).code);
  const production = s && typeof s.production === 'object' ? s.production : null;
  if (!s || !production) notFound();
  const ui = await getUi();
  const back = { href: `/repertoar/${production.slug}`, label: ui.showBooking.back };
  const [viewer, billing, taken] = await Promise.all([
    getCurrentUser(),
    billingSettings(payload),
    seatsTaken(payload, [s.id]),
  ]);
  const state = showState(showFacts(s, taken.get(s.id) ?? 0), new Date());
  const price = ticketPrice(s);
  const venue = typeof s.venue === 'object' ? s.venue : null;

  return (
    <AccountShell eyebrow={ui.showBooking.title} heading={`*${production.title}*`} wide>
      {!billing.online ? (
        <CheckoutNotice text={PAUSED} back={back} />
      ) : state.state === 'full' ? (
        <CheckoutNotice text={ui.sessions.full} back={back} />
      ) : state.state === 'closed' || price === 0 ? (
        // a free show is booked from its button (no checkout)
        <CheckoutNotice text={ui.showBooking.closed} back={back} />
      ) : (
        <CheckoutForm
          action={showCheckoutAction}
          hidden={{ eloadas: s.code ?? '' }}
          price={price}
          perSeat={{
            max: Math.min(state.left, billing.showDefaults.maxPerBooking),
            label: ui.showBooking.seats,
            loginAfter: ui.showBooking.checkoutLoginAfter,
          }}
          loginHref={`/belepes?vissza=${encodeURIComponent(showCheckoutPath(s.code ?? ''))}`}
          provider={paymentProvider().brand}
          summary={
            <CheckoutSummary
              title={showDateLine(String(s.date).slice(0, 10), s.time)}
              lines={venue ? [venue.name] : []}
              meta={[ticketText(price, ui), fill(ui.sessions.left, { count: String(state.left) })].join(' · ')}
            />
          }
          policy={[ui.showBooking.noRefund]}
          me={checkoutMe(viewer)}
        />
      )}
    </AccountShell>
  );
}
