/**
 * Payment e-mails, in the shared layout: to the participant (the payment link, paid, late payment
 * refunded) and to staff (new paid sign-up, alerts). Failures are logged, never thrown.
 */
import type { Payload } from 'payload';

import {
  type Applicant,
  details,
  hello,
  LINK_NOTE,
  myApplicationsButton,
  send,
  type TargetInfo,
} from '@/lib/applications/notify';
import type { ApplicationSettings } from '@/lib/applications/settings';
import { formatHuf } from '@/lib/format';
import { emailLayout, siteUrl } from '@/payload/email';

export type PaidInfo = {
  /** HUF */
  price: number;
  creditUsed: number;
  amountDue: number;
};

const paidRows = (p: PaidInfo) => [
  { label: 'Fizetve', value: formatHuf(p.amountDue) },
  ...(p.creditUsed ? [{ label: 'Kreditből', value: formatHuf(p.creditUsed) }] : []),
];

/** Payment received: the place is theirs. A workshop gets its calendar file. */
export async function sendOrderPaid(
  payload: Payload,
  a: Applicant,
  t: TargetInfo,
  p: PaidInfo,
  opts: { loggedIn: boolean; ics?: string; extra?: string[] },
) {
  await send(
    payload,
    a.email,
    `Sikeres fizetés: ${t.title}`,
    emailLayout({
      preheader: [t.title, t.when].filter(Boolean).join(' · '),
      heading: 'Megkaptuk a fizetést',
      paragraphs: [
        hello(a),
        'Köszönjük, a fizetés rendben megérkezett — a helyed biztos.',
        ...(opts.extra ?? []),
        ...(opts.ics ? ['A naptáradba a mellékelt fájllal veheted fel.'] : []),
        'A jelentkezésed a fiókodban követheted.',
      ],
      details: details(t, paidRows(p)),
      button: await myApplicationsButton(payload, a.userId, !opts.loggedIn),
      footnote: opts.loggedIn ? undefined : LINK_NOTE,
    }),
    opts.ics,
  );
}

/** Sent with the payment page: the order page, to pay later if that page got closed (a backup). */
export async function sendPaymentLink(
  payload: Payload,
  a: Applicant,
  t: TargetInfo,
  p: { amount: number; holdUntil: string; href: string },
) {
  const until = new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(p.holdUntil));
  await send(
    payload,
    a.email,
    `Jelentkezésed fizetése: ${t.title}`,
    emailLayout({
      preheader: `A helyedet ${until}-ig tartjuk.`,
      heading: 'Már csak a fizetés van hátra',
      paragraphs: [
        hello(a),
        `Megkaptuk a jelentkezésed; a helyed a fizetéssel lesz biztos. ${until}-ig tartjuk neked.`,
        'Ha a fizetési oldal bezárult vagy a fizetés megszakadt, ezen a linken folytathatod — később is, amíg van szabad hely. Ha már fizettél, a link a fizetés állapotát mutatja.',
      ],
      details: details(t, [{ label: 'Fizetendő', value: formatHuf(p.amount) }]),
      button: { label: 'Fizetés', href: p.href },
    }),
  );
}

/** Paid after the hold ran out and the place was taken meanwhile: the money goes back. */
export async function sendLateRefund(payload: Payload, a: Applicant, t: TargetInfo, amount: number) {
  await send(
    payload,
    a.email,
    `Visszautaltuk a befizetésed: ${t.title}`,
    emailLayout({
      preheader: 'A hely időközben betelt.',
      heading: 'Visszautaltuk a befizetésed',
      paragraphs: [
        hello(a),
        'A fizetésed a foglalási idő lejárta után érkezett meg, és a helyet közben más foglalta el. Az összeget teljes egészében visszautaltuk; néhány munkanapon belül jelenik meg a számládon.',
        'Elnézést a kellemetlenségért! A többi időpontot a weboldalon találod.',
      ],
      details: details(t, [{ label: 'Visszautalva', value: formatHuf(amount) }]),
      button: { label: 'Időpontok', href: siteUrl('/nyitott-alkalmak/') },
    }),
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
  await send(
    payload,
    s.notifyEmails,
    `Új fizetett jelentkezés: ${a.name} — ${t.title}`,
    emailLayout({
      preheader: `${a.name}, ${formatHuf(p.price)}`,
      heading: 'Új fizetett jelentkezés',
      paragraphs: [`${a.name} (${a.email}${a.phone ? `, ${a.phone}` : ''}) jelentkezett és fizetett.`],
      details: details(t, [...paidRows(p), ...(count ? [{ label: 'Létszám', value: count }] : [])]),
      button: { label: 'Jelentkezések', href: siteUrl('/admin/jelentkezesek') },
    }),
  );
}

/** Something needs a person: an amount mismatch, an automatic refund, a failing invoice… */
export async function sendStaffAlert(payload: Payload, s: ApplicationSettings, subject: string, lines: string[]) {
  await send(
    payload,
    s.notifyEmails,
    `Figyelem: ${subject}`,
    emailLayout({ preheader: subject, heading: subject, paragraphs: lines }),
  );
}
