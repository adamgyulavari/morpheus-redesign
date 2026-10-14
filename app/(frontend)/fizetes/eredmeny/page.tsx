import { notFound } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import OrderResult from '@/components/payments/OrderResult';
import { payloadClient } from '@/lib/auth';
import { orderStatus } from '@/lib/payments/service';

export const dynamic = 'force-dynamic';

export const generateMetadata = () => accountMetadata('Fizetés');

/** /fizetes/eredmeny?rendeles=…: back from the payment page (by the order's token, not its id). */
export default async function ResultPage({ searchParams }: { searchParams: Promise<{ rendeles?: string }> }) {
  const token = (await searchParams).rendeles ?? '';
  const order = await orderStatus(await payloadClient(), token);
  if (!order) notFound();
  return (
    <AccountShell eyebrow="Fizetés" heading="*Jelentkezés*">
      <OrderResult token={token} initial={order} />
    </AccountShell>
  );
}
