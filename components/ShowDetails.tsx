import Image from 'next/image';
import Link from 'next/link';

import { showDateLine } from '@/lib/dates';
import type { ShowWithRelations } from '@/lib/types';

import DetailsDialog from './DetailsDialog';
import Lines from './Lines';

/** "Az előadásról" link + popup: description, cast, credits, audience info and the ticket/registration button. */
export default function ShowDetails({
  show,
  labels,
}: {
  show: ShowWithRelations;
  labels: { ticket: string; registration: string; about: string; info: string };
}) {
  const p = show.production;
  const titleId = `show-${show.id}-title`;
  // productions with their own page link there; the others open the popup
  if (p.detailPage) {
    return (
      <Link href={`/repertoar/${p.slug}`} className="link mt-1 self-start text-sm font-bold text-teal lg:text-base">
        {labels.about}
      </Link>
    );
  }
  return (
    <DetailsDialog label={labels.about} titleId={titleId} buttonClassName="link mt-1 self-start text-sm font-bold text-teal lg:text-base">
      <div className="flex items-end gap-4 pr-12 lg:gap-5">
        <Image
          src={p.poster.src}
          alt=""
          width={p.poster.width}
          height={p.poster.height}
          sizes="80px"
          className="h-28 w-20 shrink-0 rounded-[10px] bg-deep object-cover shadow-[0_10px_20px_-12px_rgba(11,58,63,0.6)]"
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal lg:text-xs">
            {[show.label, showDateLine(show.date, show.time)].filter(Boolean).join(' · ')}
          </span>
          <h2 id={titleId} className="font-display text-[34px] leading-none lg:text-[44px]">
            {p.title}
          </h2>
          <span className="text-sm text-muted">{show.venue.name}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3.5 border-t border-line pt-5 text-[15.5px] leading-relaxed text-ink2 lg:text-[17px]">
        {p.longDescription.map((para, k) => (
          <p key={k}>
            <Lines text={para} />
          </p>
        ))}
      </div>
      {p.cast.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line pt-5">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{p.castLabel}</span>
          <p className="text-[15px] font-semibold leading-relaxed">
            {p.cast.map((c) => (c.role ? `${c.role} – ${c.names.join(' / ')}` : c.names.join(' / '))).join(', ')}
          </p>
        </div>
      )}
      {p.credits.length > 0 && (
        <div className="flex flex-col gap-1 text-sm">
          {p.credits.map((c) => (
            <span key={c.label}>
              <span className="text-muted">{c.label}: </span>
              <span className="font-semibold">{c.name}</span>
            </span>
          ))}
        </div>
      )}
      {show.info && show.info.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl bg-sand p-5">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-rust-dark">{labels.info}</span>
          <ul className="flex flex-col gap-1.5 text-[15px] leading-relaxed text-ink2">
            {show.info.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      {(show.ticketUrl || show.registrationUrl) && (
        <a href={show.ticketUrl ?? show.registrationUrl} className="btn btn-lg btn-primary self-start">
          {show.ticketUrl ? labels.ticket : labels.registration}
        </a>
      )}
    </DetailsDialog>
  );
}
