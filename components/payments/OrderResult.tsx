'use client';

/**
 * The order page's body: paid / back from the payment page and waiting for the answer (polled for
 * ~30 s — the webhook decides) / unpaid ("Fizetés" — also after the hold ran out, while a place is
 * free — or "Mégse") / cancelled / refunded.
 */
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

import { Card } from '@/components/account/Card';
import { useUi } from '@/components/UiStrings';
import { fill, formatHuf } from '@/lib/format';
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
  const ui = useUi();
  const tickets = ui.showBooking;
  const t = ui.order;
  const show = order.kind === 'show';
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
            <h2 className="font-display text-[34px] leading-tight">{t.paid}</h2>
            <p className="text-[17px] leading-relaxed">
              {order.amountDue > 0 ? `${fill(t.received, { amount: formatHuf(order.amountDue) })} ` : ''}
              {t.confirmation}
            </p>
            <Link href="/fiokom" className="btn btn-md btn-primary self-start">
              {ui.common.account}
            </Link>
          </>
        )}
        {waiting && !waitedOut && (
          <>
            <h2 className="font-display text-[34px] leading-tight">{t.processing}</h2>
            <p className="text-[17px] leading-relaxed">{t.processingText}</p>
          </>
        )}
        {unpaid && (
          <>
            <h2 className="font-display text-[34px] leading-tight">{order.lastFailed ? t.failed : t.waiting}</h2>
            <p className="text-[17px] leading-relaxed">
              {[
                order.lastFailed && t.noCharge,
                order.lapsed ? t.lapsed : until && fill(t.holdUntil, { time: until }),
                waitedOut && t.waitedOut,
              ]
                .filter(Boolean)
                .join(' ')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-md btn-primary" disabled={pending} onClick={retry}>
                {pending ? ui.common.wait : fill(ui.checkout.pay, { amount: formatHuf(order.amountDue) })}
              </button>
              <button type="button" className="btn btn-md btn-outline" disabled={pending} onClick={cancel}>
                {ui.common.cancel}
              </button>
            </div>
          </>
        )}
        {order.status === 'canceled' && (
          <>
            <h2 className="font-display text-[34px] leading-tight">{show ? tickets.orderCancelled : t.cancelled}</h2>
            <p className="text-[17px] leading-relaxed">{t.noCharge}</p>
            <Link href={again} className="link self-start font-semibold">
              {show ? tickets.orderAgain : t.again}
            </Link>
          </>
        )}
        {(order.status === 'refunded' || order.status === 'partially_refunded') && (
          <>
            <h2 className="font-display text-[34px] leading-tight">{t.refunded}</h2>
            <p className="text-[17px] leading-relaxed">{t.refundedText}</p>
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
