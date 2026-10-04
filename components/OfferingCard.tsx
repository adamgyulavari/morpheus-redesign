import type { Fact, Link } from '@/lib/types';

import SmartLink from './SmartLink';

/** Homepage "Képzések és alkalmak" card. The first card is the highlighted teal one. */
export default function OfferingCard({
  badge,
  title,
  text,
  facts,
  cta,
  highlighted,
}: {
  badge: string;
  title: string;
  text: string;
  facts: Fact[];
  cta: Link;
  highlighted: boolean;
}) {
  if (highlighted) {
    return (
      <article className="on-dark relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-teal px-7 py-8 text-cream lg:min-h-[520px]">
        <div className="sun absolute -right-20 -top-20 h-40 w-40 rounded-full" aria-hidden="true" />
        <span className="relative self-start rounded-full bg-gold px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-deep">{badge}</span>
        <h3 className="relative font-display text-[40px] leading-none">{title}</h3>
        <p className="leading-relaxed text-[#d7e5e2]">{text}</p>
        <dl className="mt-auto flex flex-col gap-2.5 text-[15px]">
          {facts.map((f) => (
            <div key={f.label} className="flex justify-between gap-3 border-t border-[#2f7a7d] pt-2.5">
              <dt className="text-[#b9d2ce]">{f.label}</dt>
              <dd className="font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>
        <SmartLink href={cta.href} className="btn btn-md btn-cream">
          {cta.label}
        </SmartLink>
      </article>
    );
  }
  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-line bg-paper px-7 py-8 lg:min-h-[520px]">
      <span className="self-start rounded-full bg-sand px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-deep">{badge}</span>
      <h3 className="font-display text-[40px] leading-none">{title}</h3>
      <p className="leading-relaxed text-ink2">{text}</p>
      <dl className="mt-auto flex flex-col gap-2.5 text-[15px]">
        {facts.map((f) => (
          <div key={f.label} className="flex justify-between gap-3 border-t border-line pt-2.5">
            <dt className="text-muted">{f.label}</dt>
            <dd className="font-semibold">
              {f.href ? (
                <SmartLink href={f.href} className="link text-teal">
                  {f.value}
                </SmartLink>
              ) : (
                f.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <SmartLink href={cta.href} className="btn btn-md btn-outline">
        {cta.label}
      </SmartLink>
    </article>
  );
}
