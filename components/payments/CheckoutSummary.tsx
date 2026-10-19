import type { ReactNode } from 'react';

/** The top of the checkout's right card: what you pay for (the date first), then a small line. */
export default function CheckoutSummary({
  title,
  lines = [],
  meta,
}: {
  title: string;
  lines?: string[];
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="font-display text-[28px] leading-tight">{title}</h2>
      {lines.map((l) => (
        <p key={l} className="text-[16px] text-ink2">
          {l}
        </p>
      ))}
      {meta && <p className="text-[13px] text-muted">{meta}</p>}
    </div>
  );
}
