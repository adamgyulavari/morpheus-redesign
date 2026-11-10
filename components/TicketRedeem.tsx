'use client';

/**
 * The door's button (staff): uses the ticket, then says how it went. Set apart as an admin action
 * (it can't be undone), and asked again when the show starts more than an hour from now. Nothing
 * re-renders the page (no refresh, no revalidatePath): it would come back with the ticket used,
 * without this component, and the answer would go with it. Its own wording is staff-only, in code.
 */
import { useId, useState, useTransition } from 'react';

import Dialog from '@/components/Dialog';
import { redeemTicketAction } from '@/lib/applications/ticket-actions';

const HOUR = 3_600_000;

const startText = (iso: string) =>
  new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

const dangerButton =
  'btn btn-lg w-full justify-center border-[1.5px] border-rust-dark bg-rust-dark py-5 text-[20px] text-cream';

export default function TicketRedeem({
  code,
  startsAt,
  labels,
}: {
  code: string;
  startsAt: string;
  labels: { use: string; done: string; already: string; invalid: string };
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const titleId = useId();

  const redeem = () =>
    start(async () => {
      setAsking(false);
      const result = await redeemTicketAction(code);
      setAnswer(result === 'used' ? labels.done : result === 'already' ? labels.already : labels.invalid);
    });
  const askOrRedeem = () => {
    if (new Date(startsAt).getTime() - Date.now() > HOUR) setAsking(true);
    else redeem();
  };

  if (answer)
    return (
      <p role="status" className="rounded-2xl bg-teal/10 px-5 py-4 text-center text-[18px] font-semibold text-teal">
        {answer}
      </p>
    );
  return (
    <section className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-rust p-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-rust-dark">Jegybeengedés — admin funkció</h2>
      <p className="text-[15px] leading-snug text-ink2">
        A gomb felhasználtnak jelöli a jegyet: utána nem lehet vele belépni, és nem vonható vissza. A bejáratnál, az
        előadás kezdetekor használd.
      </p>
      <button type="button" className={dangerButton} disabled={pending} onClick={askOrRedeem}>
        {labels.use}
      </button>
      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        labelledBy={titleId}
        className="m-auto w-[min(92vw,480px)] rounded-[22px] border-0 bg-paper p-0 text-ink shadow-[0_30px_60px_-20px_rgba(8,31,34,0.6)] backdrop:bg-night/60 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex flex-col gap-4 p-7">
          <h2 id={titleId} className="font-display text-[28px] leading-tight">
            Még nincs itt az előadás ideje
          </h2>
          <p className="text-[16px] leading-relaxed text-ink2">
            Az előadás {startText(startsAt)}-kor kezdődik, több mint egy óra múlva. Ha most beengeded, a jegy
            felhasználttá válik, és az előadáson már nem lehet vele belépni.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-md btn-outline" onClick={() => setAsking(false)}>
              Mégse
            </button>
            <button
              type="button"
              className="btn btn-md border-[1.5px] border-rust-dark bg-rust-dark text-cream"
              disabled={pending}
              onClick={redeem}
            >
              Mégis beengedem
            </button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
