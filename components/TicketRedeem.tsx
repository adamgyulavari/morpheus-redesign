'use client';

/**
 * The door's one button (staff): uses the ticket, then says how it went. Nothing re-renders the page
 * (no refresh, no revalidatePath): it would come back with the ticket used, without this component,
 * and the answer would go with it.
 */
import { useState, useTransition } from 'react';

import { redeemTicketAction } from '@/lib/applications/ticket-actions';

export default function TicketRedeem({
  code,
  labels,
}: {
  code: string;
  labels: { use: string; done: string; already: string; invalid: string };
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const redeem = () =>
    start(async () => {
      const r = await redeemTicketAction(code);
      setAnswer(r === 'used' ? labels.done : r === 'already' ? labels.already : labels.invalid);
    });
  if (answer)
    return (
      <p role="status" className="rounded-2xl bg-teal/10 px-5 py-4 text-center text-[18px] font-semibold text-teal">
        {answer}
      </p>
    );
  return (
    <button
      type="button"
      className="btn btn-lg btn-primary w-full justify-center py-5 text-[20px]"
      disabled={pending}
      onClick={redeem}
    >
      {labels.use}
    </button>
  );
}
