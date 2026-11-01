'use client';

import { useState } from 'react';

import { CalendarIcon } from '@/components/icons';
import type { UiStrings } from '@/payload/ui-catalogue';

type Texts = Pick<
  UiStrings['overview'],
  'calendar' | 'calendarText' | 'calendarGoogle' | 'calendarApple' | 'calendarCopy' | 'calendarCopied'
>;

/**
 * "Naptár": subscribing to the person's calendar feed — Google (by its link), Apple and Outlook
 * (webcal://), or the link copied for anything else. The link is personal: whoever has it sees the dates.
 */
export default function CalendarSubscribe({ feed, t }: { feed: string; t: Texts }) {
  const [copied, setCopied] = useState(false);
  const webcal = feed.replace(/^https?:/, 'webcal:');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  const button = 'btn btn-md btn-outline';
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line p-6">
      <h3 className="flex items-center gap-2 font-display text-[26px] leading-none">
        <CalendarIcon className="h-6 w-6 text-teal" />
        {t.calendar}
      </h3>
      <p className="text-[15px] leading-relaxed text-ink2">{t.calendarText}</p>
      <div className="flex flex-wrap gap-2">
        <a
          className={button}
          href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`}
          target="_blank"
          rel="noopener"
        >
          {t.calendarGoogle}
        </a>
        <a className={button} href={webcal}>
          {t.calendarApple}
        </a>
        <button type="button" className={button} onClick={copy}>
          {copied ? t.calendarCopied : t.calendarCopy}
        </button>
      </div>
    </section>
  );
}
