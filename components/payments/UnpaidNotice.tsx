import Link from 'next/link';

import { ArrowRight } from '@/components/icons';
import { formatHuf } from '@/lib/format';
import type { MyUnpaid } from '@/lib/payments/my-orders';

/** Unfinished payments (/fiokom, /fiokom/szamlaim): each continues on its order page. */
export default function UnpaidNotice({ unpaid }: { unpaid: MyUnpaid[] }) {
  if (!unpaid.length) return null;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-gold/60 bg-gold/10 p-5 lg:p-6">
      <h2 className="text-[17px] font-semibold">Befejezetlen fizetés</h2>
      {unpaid.map((u) => (
        <div key={u.href} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold">{u.label}</span>
            <span className="text-[14px] text-ink2">
              {formatHuf(u.amount)}
              {u.lapsed ? ' · a foglalás lejárt; ha van még hely, most is kifizetheted' : ' · a helyedet még tartjuk'}
            </span>
          </div>
          <Link href={u.href} className="btn btn-md btn-primary">
            Fizetés folytatása
            <ArrowRight />
          </Link>
        </div>
      ))}
    </div>
  );
}
