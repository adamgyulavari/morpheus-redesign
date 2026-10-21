import AccountNav from '@/components/account/AccountNav';
import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { accountMetadata } from '@/components/account/meta';
import UnpaidNotice from '@/components/payments/UnpaidNotice';
import { payloadClient, requireUser } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { fill, formatHuf } from '@/lib/format';
import { myOrders } from '@/lib/payments/my-orders';
import { mayBookRooms } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).invoices.title);

const dayText = (iso: string) =>
  new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));

/**
 * My online payments with their invoices, my monthly fee / instalment invoices (to pay by transfer),
 * any unfinished payment. PDFs from Számlázz.hu, only mine.
 */
export default async function InvoicesPage() {
  const user = await requireUser('/fiokom/szamlaim');
  const [{ paid, unpaid, bills }, ui] = await Promise.all([myOrders(await payloadClient(), user), getUi()]);
  const t = ui.invoices;
  const status = { paid: t.statusPaid, refunded: t.statusRefunded, partially_refunded: t.statusPartial };
  const name = (i: { kind?: string | null; number?: string | null }) =>
    fill(i.kind === 'storno' ? t.storno : t.invoice, { number: i.number ?? '' });
  return (
    <AccountShell eyebrow={ui.nav.myAccount} heading={`*${t.title}*`} wide>
      <AccountNav canBook={mayBookRooms(user)} isStaff={userIsStaffOrAdmin(user)} />
      <div className="grid max-w-[880px] gap-5">
        <UnpaidNotice unpaid={unpaid} />
        {bills.length > 0 && (
          <Card>
            <h2 className="font-display text-[28px] leading-tight">{t.bills}</h2>
            <ul className="flex flex-col divide-y divide-line">
              {bills.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[16px] font-semibold">{b.label}</span>
                    <span className="text-[14px] text-ink2">
                      {formatHuf(b.amount)} ·{' '}
                      {b.reversed
                        ? t.reversed
                        : b.paid
                          ? t.paid
                          : b.dueDate
                            ? fill(t.dueBy, { date: dayText(b.dueDate) })
                            : t.due}
                    </span>
                  </div>
                  <div className="text-[14px]">
                    {b.pdf ? (
                      <a
                        href={`/fiokom/szamlaim/${b.id}`}
                        target="_blank"
                        rel="noopener"
                        className="link font-semibold"
                      >
                        {name(b)} {t.pdf}
                      </a>
                    ) : (
                      <span className="text-muted">{b.number ? name(b) : t.soon}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Card>
          <h2 className="font-display text-[28px] leading-tight">{t.online}</h2>
          {!paid.length ? (
            <p className="text-[15px] text-muted">{t.none}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {paid.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[16px] font-semibold">{o.label}</span>
                    <span className="text-[14px] text-ink2">
                      {o.paidAt ? dayText(o.paidAt) : ''} · {formatHuf(o.amount)} · {status[o.status]}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[14px]">
                    {o.invoices.length ? (
                      o.invoices.map((i) =>
                        i.pdf ? (
                          <a
                            key={i.id}
                            href={`/fiokom/szamlaim/${i.id}`}
                            target="_blank"
                            rel="noopener"
                            className="link font-semibold"
                          >
                            {name(i)} {t.pdf}
                          </a>
                        ) : (
                          <span key={i.id} className="text-muted">
                            {name(i)}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="text-muted">{t.soon}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <p className="text-[13px] text-muted">{t.footer}</p>
      </div>
    </AccountShell>
  );
}
