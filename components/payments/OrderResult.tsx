'use client';

/**
 * The order page's body: paid / back from the payment page and waiting for the answer (polled for
 * ~30 s — the webhook decides) / unpaid ("Fizetés" — also after the hold ran out, while a place is
 * free — or "Mégse") / cancelled / refunded.
 */
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

import { Card } from '@/components/account/Card';
import { formatHuf } from '@/lib/format';
import { cancelOrderAction, orderStatusAction, retryPaymentAction } from '@/lib/payments/actions';
import type { OrderView } from '@/lib/payments/order-page';

const POLL_MS = 3_000;
const POLL_FOR_MS = 30_000;

export default function OrderResult({
  token,
  initial,
  returned,
}: {
  token: string;
  initial: OrderView;
  /** Back from the payment page (not the e-mailed link): wait for the provider first. */
  returned: boolean;
}) {
  const [order, setOrder] = useState(initial);
  const [waitedOut, setWaitedOut] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const waiting = returned && order.status === 'pending' && order.processing;
  const unpaid = order.status === 'pending' && !(waiting && !waitedOut);

  useEffect(() => {
    if (!waiting) return;
    const started = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - started > POLL_FOR_MS) {
        setWaitedOut(true);
        clearInterval(timer);
        return;
      }
      const next = await orderStatusAction(token);
      if (next) setOrder(next);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, token]);

  const retry = () =>
    start(async () => {
      setError('');
      const r = await retryPaymentAction(token);
      if (r?.error) setError(r.error);
    });
  const cancel = () =>
    start(async () => {
      setError('');
      const r = await cancelOrderAction(token);
      if (r.error) setError(r.error);
      const next = await orderStatusAction(token);
      if (next) setOrder(next);
    });
  const again = order.againPath ?? '/';
  const until =
    order.expiresAt &&
    new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', hour: '2-digit', minute: '2-digit' }).format(
      new Date(order.expiresAt),
    );

  return (
    <Card>
      <p className="text-[15px] font-semibold text-ink2">{order.label}</p>
      <div role="status" aria-live="polite" className="flex flex-col gap-3">
        {order.status === 'paid' && (
          <>
            <h2 className="font-display text-[34px] leading-tight">Sikeres fizetés — várunk!</h2>
            <p className="text-[17px] leading-relaxed">
              {order.amountDue > 0 ? `Megkaptuk a befizetésed (${formatHuf(order.amountDue)}). ` : ''}A visszaigazolást
              e-mailben küldjük.
            </p>
            <Link href="/fiokom" className="btn btn-md btn-primary self-start">
              Fiókom
            </Link>
          </>
        )}
        {waiting && !waitedOut && (
          <>
            <h2 className="font-display text-[34px] leading-tight">A fizetés feldolgozása…</h2>
            <p className="text-[17px] leading-relaxed">Egy pillanat, várjuk a fizetési szolgáltató visszajelzését.</p>
          </>
        )}
        {unpaid && (
          <>
            <h2 className="font-display text-[34px] leading-tight">
              {order.lastFailed ? 'A fizetés nem sikerült' : 'Fizetésre vár'}
            </h2>
            <p className="text-[17px] leading-relaxed">
              {order.lastFailed ? 'Pénzt nem vontunk le. ' : ''}
              {order.lapsed
                ? 'A foglalási idő lejárt; ha van még szabad hely, most is kifizetheted.'
                : until
                  ? `A helyedet ${until}-ig tartjuk.`
                  : ''}
              {waitedOut
                ? ' Ha már fizettél, nem kell újra: amint a visszajelzés megérkezik, e-mailben értesítünk.'
                : ''}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-md btn-primary" disabled={pending} onClick={retry}>
                {pending ? 'Egy pillanat…' : `Fizetés — ${formatHuf(order.amountDue)}`}
              </button>
              <button type="button" className="btn btn-md btn-outline" disabled={pending} onClick={cancel}>
                Mégse
              </button>
            </div>
          </>
        )}
        {order.status === 'canceled' && (
          <>
            <h2 className="font-display text-[34px] leading-tight">Megszakítottad a jelentkezést</h2>
            <p className="text-[17px] leading-relaxed">Pénzt nem vontunk le.</p>
            <Link href={again} className="link self-start font-semibold">
              Mégis jelentkezem
            </Link>
          </>
        )}
        {(order.status === 'refunded' || order.status === 'partially_refunded') && (
          <>
            <h2 className="font-display text-[34px] leading-tight">Visszautaltuk a befizetést</h2>
            <p className="text-[17px] leading-relaxed">A részleteket e-mailben küldtük el.</p>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[15px] font-semibold text-rust-dark">
          {error}
        </p>
      )}
    </Card>
  );
}
