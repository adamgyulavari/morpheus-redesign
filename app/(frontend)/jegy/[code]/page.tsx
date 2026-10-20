import { notFound } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { accountMetadata } from '@/components/account/meta';
import TicketRedeem from '@/components/TicketRedeem';
import { ticketByCode, ticketSvg } from '@/lib/applications/tickets';
import { getCurrentUser, payloadClient } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { fill } from '@/lib/format';
import { userIsStaffOrAdmin } from '@/payload/access';

// per moment (used or not), never cached; the code is the secret
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { ...(await accountMetadata((await getUi()).showBooking.ticket)), referrer: 'no-referrer' as const };
}

type Props = { params: Promise<{ code: string }> };

const timeText = (iso: string) =>
  new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

/**
 * /jegy/<code>: what a ticket's QR code opens. Staff (logged in, at the door) get one button that
 * uses it; anyone else sees the ticket, whether it is still valid, and its QR code.
 */
export default async function TicketPage({ params }: Props) {
  const { code } = await params;
  const [t, viewer, ui] = await Promise.all([ticketByCode(await payloadClient(), code), getCurrentUser(), getUi()]);
  if (!t) notFound();
  const b = ui.showBooking;
  const staff = userIsStaffOrAdmin(viewer);
  const state =
    t.state === 'used'
      ? fill(b.ticketUsed, { time: timeText(t.usedAt ?? '') })
      : t.state === 'valid'
        ? b.ticketValid
        : b.ticketInvalid;
  const tone = t.state === 'valid' ? 'bg-teal/10 text-teal' : 'bg-rust/10 text-rust-dark';

  return (
    <AccountShell eyebrow={b.ticket} heading={`*${t.title}*`}>
      <Card>
        <p className={`rounded-2xl px-5 py-4 text-center text-[18px] font-semibold ${tone}`}>{state}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[16px]">
          <dt className="text-muted">{b.ticketWhen}</dt>
          <dd className="font-semibold">{t.when}</dd>
          {t.place && (
            <>
              <dt className="text-muted">{b.ticketWhere}</dt>
              <dd>{t.place}</dd>
            </>
          )}
          <dt className="text-muted">{b.ticketName}</dt>
          <dd>{t.name}</dd>
          <dt className="text-muted">{b.ticket}</dt>
          <dd>{fill(b.ticketOf, { n: String(t.n), of: String(t.of) })}</dd>
        </dl>
        {staff && t.state === 'valid' ? (
          <TicketRedeem
            code={t.code}
            labels={{ use: b.ticketUse, done: b.ticketDone, already: b.ticketUsedAlready, invalid: b.ticketInvalid }}
          />
        ) : (
          !staff &&
          t.state === 'valid' && (
            <div className="flex flex-col items-center gap-3">
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: our own QR code's SVG */}
              <div className="w-[240px] max-w-full" dangerouslySetInnerHTML={{ __html: await ticketSvg(t.code) }} />
              <p className="text-center text-[15px] text-ink2">{b.ticketShow}</p>
            </div>
          )
        )}
      </Card>
    </AccountShell>
  );
}
