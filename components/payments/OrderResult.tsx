'use client';

/**
 * The result page's body: paid / still pending (polled for ~30 s — the webhook decides) / failed
 * ("Újrapróbálom" while the place is held, or "Mégse") / expired / cancelled.
 */
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

import { Card } from '@/components/account/Card';
import { formatHuf } from '@/lib/format';
import { cancelOrderAction, orderStatusAction, retryPaymentAction } from '@/lib/payments/actions';
import type { OrderView } from '@/lib/payments/service';

const POLL_MS = 3_000;
const POLL_FOR_MS = 30_000;

export default function OrderResult({ token, initial }: { token: string; initial: OrderView }) {
  const [order, setOrder] = useState(initial);
  const [waitedOut, setWaitedOut] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const waiting = order.status === 'pending' && !order.lastFailed;

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
  const again = order.sessionId ? `/fizetes?session=${order.sessionId}` : '/nyitott-alkalmak/';

  return (
    <Card>
      <p className="text-[15px] font-semibold text-ink2">{order.label}</p>
      <div role="status" aria-live="polite" className="flex flex-col gap-3">
        {order.status === 'paid' && (
          <>
            <h2 className="font-display text-[34px] leading-tight">Sikeres fizetés — várunk!</h2>
            <p className="text-[17px] leading-relaxed">
              {order.amountDue > 0 ? `Megkaptuk a ${formatHuf(order.amountDue)} befizetést. ` : ''}
              {order.creditUsed > 0 ? `Kreditből: ${formatHuf(order.creditUsed)}. ` : ''}A visszaigazolást e-mailben
              küldjük.
            </p>
            <Link href="/fiokom" className="btn btn-md btn-primary self-start">
              Fiókom
            </Link>
          </>
        )}
        {waiting && (
          <>
            <h2 className="font-display text-[34px] leading-tight">A fizetés feldolgozása…</h2>
            <p className="text-[17px] leading-relaxed">
              {waitedOut
                ? 'Még nem kaptunk visszajelzést a fizetési szolgáltatótól. Amint megérkezik, e-mailben értesítünk — nem kell újra fizetned.'
                : 'Egy pillanat, várjuk a fizetési szolgáltató visszajelzését.'}
            </p>
          </>
        )}
        {order.status === 'pending' && order.lastFailed && (
          <>
            <h2 className="font-display text-[34px] leading-tight">A fizetés nem sikerült</h2>
            <p className="text-[17px] leading-relaxed">
              Pénzt nem vontunk le. A helyedet még tartjuk
              {order.expiresAt
                ? ` ${new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', hour: '2-digit', minute: '2-digit' }).format(new Date(order.expiresAt))}-ig`
                : ''}
              .
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-md btn-primary" disabled={pending} onClick={retry}>
                {pending ? 'Egy pillanat…' : 'Újrapróbálom'}
              </button>
              <button type="button" className="btn btn-md btn-outline" disabled={pending} onClick={cancel}>
                Mégse
              </button>
            </div>
          </>
        )}
        {order.status === 'expired' && (
          <>
            <h2 className="font-display text-[34px] leading-tight">Lejárt a foglalás</h2>
            <p className="text-[17px] leading-relaxed">A fizetés nem érkezett meg időben, a helyet felszabadítottuk.</p>
            <Link href={again} className="btn btn-md btn-primary self-start">
              Újra jelentkezem
            </Link>
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
