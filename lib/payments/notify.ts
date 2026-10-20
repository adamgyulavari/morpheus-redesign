/**
 * Payment e-mails: to the participant (the payment link, paid, late payment refunded) and to staff
 * (new paid sign-up). Their texts are in the admin (Beállítások → E-mailek); the technical staff
 * alerts (sendStaffAlert) are not — they stay here. Failures are logged, never thrown.
 */
import type { Payload } from 'payload';

import {
  type Applicant,
  details,
  myAccountLink,
  send,
  type TargetInfo,
  type TicketImage,
  varsOf,
} from '@/lib/applications/notify';
import type { ApplicationSettings } from '@/lib/applications/settings';
import { formatHuf } from '@/lib/format';
import { emailLayout, fromTemplate, siteUrl } from '@/payload/email';
import { emailTexts } from '@/payload/email-texts';

export type PaidInfo = {
  /** HUF */
  price: number;
  amountDue: number;
};

/** Payment received: the place is theirs. A workshop gets its calendar file. */
export async function sendOrderPaid(
  payload: Payload,
  a: Applicant,
  t: TargetInfo,
  p: PaidInfo,
  opts: { loggedIn: boolean; ics?: string; waitingForGroup?: boolean; tickets?: TicketImage[] },
) {
  const texts = await emailTexts(payload);
  const key = t.seats ? 'ticketPaid' : 'orderPaid';
  const tpl = texts.template(key);
  const vars = { ...varsOf(a, t), osszeg: formatHuf(p.amountDue) };
  await send(
    payload,
    a.email,
    fromTemplate(texts, key, vars, {
      greet: { firstName: a.firstName },
      after: [opts.waitingForGroup ? tpl.waitingForGroup : undefined, opts.ics ? tpl.calendarNote : undefined].filter(
        (x): x is string => Boolean(x),
      ),
      details: details(texts.common, t, [{ label: texts.common.labelPaid, value: formatHuf(p.amountDue) }]),
      href: await myAccountLink(payload, a.userId, !opts.loggedIn),
      footnote: opts.loggedIn ? undefined : texts.common.loginLinkNote,
      tickets: opts.tickets,
    }),
    opts.ics,
    opts.tickets,
  );
}

/** Sent with the payment page: the order page, to pay later if that page got closed (a backup). */
export async function sendPaymentLink(
  payload: Payload,
  a: Applicant,
  t: TargetInfo,
  p: { amount: number; holdUntil: string; href: string },
) {
  const texts = await emailTexts(payload);
  const hatarido = new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(p.holdUntil));
  await send(
    payload,
    a.email,
    fromTemplate(
      texts,
      t.seats ? 'ticketPaymentLink' : 'paymentLink',
      { ...varsOf(a, t), osszeg: formatHuf(p.amount), hatarido },
      {
        greet: { firstName: a.firstName },
        details: details(texts.common, t, [{ label: texts.common.labelDue, value: formatHuf(p.amount) }]),
        href: p.href,
      },
    ),
  );
}

/** Paid after the hold ran out and the place was taken meanwhile: the money goes back. */
export async function sendLateRefund(payload: Payload, a: Applicant, t: TargetInfo, amount: number) {
  const texts = await emailTexts(payload);
  await send(
    payload,
    a.email,
    fromTemplate(
      texts,
      'lateRefund',
      { ...varsOf(a, t), osszeg: formatHuf(amount) },
      {
        greet: { firstName: a.firstName },
        details: details(texts.common, t, [{ label: texts.common.labelRefunded, value: formatHuf(amount) }]),
        href: siteUrl('/nyitott-alkalmak/'),
      },
    ),
  );
}

// ── to staff ────────────────────────────────────────────────────────────────

/** A new paid sign-up (replaces 3A's "new sign-up" notice for workshop and beginner). */
export async function sendStaffPaid(
  payload: Payload,
  s: ApplicationSettings,
  a: Applicant,
  t: TargetInfo,
  p: PaidInfo,
  count?: string,
) {
  const texts = await emailTexts(payload);
  const c = texts.common;
  await send(
    payload,
    s.notifyEmails,
    fromTemplate(
      texts,
      t.seats ? 'staffTicketPaid' : 'staffPaid',
      { ...varsOf(a, t), osszeg: formatHuf(p.amountDue) },
      {
        greet: false,
        details: details(c, t, [
          { label: c.labelPaid, value: formatHuf(p.amountDue) },
          ...(count ? [{ label: c.labelCount, value: count }] : []),
        ]),
        href: siteUrl('/admin/jelentkezesek'),
      },
    ),
  );
}

/** Something needs a person: an amount mismatch, an automatic refund, a failing invoice… */
export async function sendStaffAlert(payload: Payload, s: ApplicationSettings, subject: string, lines: string[]) {
  // technical: stays in code (not in E-mailek); the layout's own lines still come from there
  const { common } = await emailTexts(payload);
  await send(payload, s.notifyEmails, {
    subject: `Figyelem: ${subject}`,
    html: emailLayout({
      preheader: subject,
      heading: subject,
      paragraphs: lines,
      chrome: { buttonHelp: common.buttonHelp, footer: common.footer },
    }),
  });
}
