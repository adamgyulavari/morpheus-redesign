import AccountNav from '@/components/account/AccountNav';
import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { accountMetadata } from '@/components/account/meta';
import UnpaidNotice from '@/components/payments/UnpaidNotice';
import { payloadClient, requireUser } from '@/lib/auth';
import { formatHuf } from '@/lib/format';
import { myOrders } from '@/lib/payments/my-orders';
import { mayBookRooms } from '@/lib/rooms/server';
import { userIsStaffOrAdmin } from '@/payload/access';

// per visitor, never cached or prerendered (the build has no database)
export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Számláim');

const dayText = (iso: string) =>
  new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));

const STATUS = { paid: 'Fizetve', refunded: 'Visszatérítve', partially_refunded: 'Részben visszatérítve' } as const;

/**
 * My online payments with their invoices, my monthly fee / instalment invoices (to pay by transfer),
 * any unfinished payment. PDFs from Számlázz.hu, only mine.
 */
export default async function InvoicesPage() {
  const user = await requireUser('/fiokom/szamlaim');
  const { paid, unpaid, bills } = await myOrders(await payloadClient(), user);
  return (
    <AccountShell eyebrow="Fiókom" heading="*Számláim*" wide>
      <AccountNav canBook={mayBookRooms(user)} isStaff={userIsStaffOrAdmin(user)} />
      <div className="grid max-w-[880px] gap-5">
        <UnpaidNotice unpaid={unpaid} />
        {bills.length > 0 && (
          <Card>
            <h2 className="font-display text-[28px] leading-tight">Havidíjak és részletek</h2>
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
                        ? 'Sztornózva'
                        : b.paid
                          ? 'Befizetve'
                          : `Átutalással fizetendő${b.dueDate ? `, határidő: ${dayText(b.dueDate)}` : ''}`}
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
                        Számla {b.number} (PDF)
                      </a>
                    ) : (
                      <span className="text-muted">
                        {b.number ? `Számla ${b.number}` : 'A számla hamarosan elkészül.'}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Card>
          <h2 className="font-display text-[28px] leading-tight">Online fizetések</h2>
          {!paid.length ? (
            <p className="text-[15px] text-muted">Még nincs online fizetésed.</p>
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
                      {o.paidAt ? dayText(o.paidAt) : ''} · {formatHuf(o.amount)} · {STATUS[o.status]}
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
                            {i.kind === 'storno' ? 'Sztornó' : 'Számla'} {i.number} (PDF)
                          </a>
                        ) : (
                          <span key={i.id} className="text-muted">
                            {i.kind === 'storno' ? 'Sztornó' : 'Számla'} {i.number}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="text-muted">A számla hamarosan elkészül.</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <p className="text-[13px] text-muted">
          A számlákat e-mailben is elküldjük. A számlázási adataidat az Adataim oldalon módosíthatod.
        </p>
      </div>
    </AccountShell>
  );
}
