import { notFound } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { accountMetadata } from '@/components/account/meta';
import OrderResult from '@/components/payments/OrderResult';
import { payloadClient } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { orderStatus } from '@/lib/payments/order-page';

export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).order.title);

/**
 * /fizetes/eredmeny?rendeles=…: the order page (by its token, not its id) — back from the payment
 * page (`vissza=1`), or from the e-mailed link: paid, or pay now.
 */
export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ rendeles?: string; vissza?: string }>;
}) {
  const { rendeles: token = '', vissza } = await searchParams;
  const order = await orderStatus(await payloadClient(), token);
  if (!order) notFound();
  const ui = await getUi();
  return (
    <AccountShell
      eyebrow={ui.order.title}
      heading={order.kind === 'show' ? ui.showBooking.orderHeading : ui.order.heading}
    >
      <OrderResult token={token} initial={order} returned={vissza === '1'} />
    </AccountShell>
  );
}
