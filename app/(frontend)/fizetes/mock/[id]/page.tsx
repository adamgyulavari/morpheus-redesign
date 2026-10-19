import config from '@payload-config';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';

import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { formatHuf } from '@/lib/format';
import { mockActive } from '@/lib/payments/providers';
import { mockOutcomeAction } from '@/lib/payments/providers/mock-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Teszt fizetés', robots: { index: false } };

/** The mock provider's "payment page" (development and tests only). */
export default async function MockCheckout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = /^mock_(\d+)$/.exec(id);
  if (!mockActive() || !m) notFound();
  const payload = await getPayload({ config });
  const p = await payload.findByID({ collection: 'mockPayments', id: Number(m[1]), disableErrors: true });
  if (!p) notFound();
  const act = (outcome: 'paid' | 'failed' | 'canceled') => mockOutcomeAction.bind(null, id, outcome);
  return (
    <AccountShell eyebrow="Teszt fizetési oldal" heading="*Mock* fizetés">
      <Card>
        <p className="rounded-2xl bg-sand px-4 py-3 text-[15px] text-ink2">
          Fejlesztői teszt: valódi fizetés nem történik.
        </p>
        <p className="text-[17px]">{p.description}</p>
        <p className="font-display text-[40px] leading-none">{formatHuf(p.amount)}</p>
        <p className="text-[15px] text-ink2">Állapot: {p.status}</p>
        {p.status === 'pending' && (
          <div className="flex flex-wrap gap-3">
            <form action={act('paid')}>
              <button type="submit" className="btn btn-md btn-primary">
                Fizetés
              </button>
            </form>
            <form action={act('failed')}>
              <button type="submit" className="btn btn-md btn-outline">
                Sikertelen
              </button>
            </form>
            <form action={act('canceled')}>
              <button type="submit" className="btn btn-md btn-outline">
                Mégse
              </button>
            </form>
          </div>
        )}
      </Card>
    </AccountShell>
  );
}
