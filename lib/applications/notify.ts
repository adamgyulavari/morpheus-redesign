/**
 * The e-mails of sign-ups and applications, in the shared layout (payload/email.ts). Every
 * applicant e-mail leads to /fiokom (the overview lists them) — with a week-long login link when it goes to
 * someone who may not be logged in. A failed e-mail never fails what caused it; it is logged.
 */
import type { Payload } from 'payload';

import { formatHuf } from '@/lib/format';
import { momentText } from '@/lib/rooms/format';
import { emailLayout, siteUrl } from '@/payload/email';
import { APPLICATION_LINK_TTL_MS, createLoginLink } from '@/payload/magic-link';

import type { ApplicationSettings, EmailTexts } from './settings';

export type Applicant = {
  userId: number;
  name: string;
  firstName?: string | null;
  email: string;
  phone?: string | null;
};

/** What the e-mails say about the date or course. */
export type TargetInfo = {
  /** "Nyitott Műhely" / the course group's name */
  title: string;
  /** A course application without a group (staff place it later). */
  withoutGroup?: boolean;
  /** Workshop: when; course: its dates. */
  when?: string;
  place?: string;
  price?: string;
  /** Workshop: minimum, decision time; for the sign-up e-mail. */
  minParticipants?: number;
  cutoff?: Date;
};

const MY_ACCOUNT = '/fiokom';
export const hello = (a: Applicant) => (a.firstName?.trim() ? `Kedves ${a.firstName.trim()}!` : 'Kedves Jelentkezőnk!');
const intro = (texts: EmailTexts, key: keyof EmailTexts, fallback: string) => texts[key] ?? fallback;

/** The site's price format ("6000 Ft", "45 000 Ft"); undefined without a price. */
export const huf = (n: number | null | undefined) => (n == null ? undefined : formatHuf(n));

export const details = (t: TargetInfo, extra: { label: string; value: string }[] = []) => [
  { label: 'Mire', value: t.title },
  ...(t.when ? [{ label: 'Mikor', value: t.when }] : []),
  ...(t.place ? [{ label: 'Hol', value: t.place }] : []),
  ...(t.price ? [{ label: 'Ár', value: t.price }] : []),
  ...extra,
];

/** Sends (never throws: a failed e-mail is logged). `ics`: a calendar file attached. */
export async function send(payload: Payload, to: string | string[], subject: string, html: string, ics?: string) {
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!list.length) return;
  try {
    await payload.sendEmail({
      to: list,
      subject,
      html,
      ...(ics
        ? {
            attachments: [
              { filename: 'alkalom.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' },
            ],
          }
        : {}),
    });
  } catch (err) {
    payload.logger.error({ err, msg: `application e-mail failed: ${subject}` });
  }
}

/** The "Fiókom" button: a login link for those who may not be logged in, else the page. */
export async function myApplicationsButton(payload: Payload, userId: number, login: boolean) {
  if (!login) return { label: 'Fiókom', href: siteUrl(MY_ACCOUNT) };
  try {
    const { url } = await createLoginLink(payload, userId, { ttlMs: APPLICATION_LINK_TTL_MS });
    return { label: 'Fiókom', href: `${url}&next=${encodeURIComponent(MY_ACCOUNT)}` };
  } catch (err) {
    payload.logger.error({ err, msg: 'application e-mail: login link failed' });
    return { label: 'Fiókom', href: siteUrl(MY_ACCOUNT) };
  }
}
export const LINK_NOTE = 'A gomb egy hétig belépteti a fiókodba. Később a belépés oldalon kérhetsz új belépési linket.';

// ── to the applicant ────────────────────────────────────────────────────────

/** Workshop or beginner sign-up received; professional application received. */
export async function sendReceived(
  payload: Payload,
  s: ApplicationSettings,
  a: Applicant,
  kind: 'workshop' | 'beginner' | 'professional',
  t: TargetInfo,
  account: { created: boolean; loggedIn: boolean },
) {
  const accountLine = account.created
    ? 'Fiókod elkészült — a lenti gombbal belépve itt követheted a jelentkezésed.'
    : 'A jelentkezésed a fiókodban követheted.';
  const paragraphs =
    kind === 'professional'
      ? [
          hello(a),
          intro(
            s.texts,
            'applicationReceived',
            'Köszönjük a jelentkezésed a szakmai kurzusra! Elolvassuk, és hamarosan jelentkezünk az interjú részleteivel.',
          ),
          accountLine,
        ]
      : kind === 'beginner' && t.withoutGroup
        ? [
            hello(a),
            'Köszönjük a jelentkezésed! Még nem soroltunk csoportba: hamarosan jelentkezünk, melyik csoportban kezdhetsz.',
            accountLine,
          ]
        : [
            hello(a),
            intro(s.texts, 'signupReceived', 'Köszönjük a jelentkezésed, rögzítettük a helyed.'),
            'A fizetés részleteit hamarosan e-mailben küldjük.',
            ...(kind === 'workshop' && t.minParticipants && t.cutoff
              ? [
                  `Az alkalom legalább ${t.minParticipants} jelentkezővel indul; ez ${momentText(t.cutoff)}-kor dől el, és e-mailben értesítünk róla.`,
                  `Ha mégsem tudsz jönni, a fiókodban mondhatod le, legkésőbb ${s.userCancelHours} órával a kezdés előtt.`,
                ]
              : []),
            accountLine,
          ];
  await send(
    payload,
    a.email,
    kind === 'professional' ? 'Megkaptuk a jelentkezésed' : `Jelentkezés: ${t.title}`,
    emailLayout({
      preheader: kind === 'professional' ? 'Hamarosan jelentkezünk.' : [t.title, t.when].filter(Boolean).join(' · '),
      heading: 'Megkaptuk a jelentkezésed',
      paragraphs,
      details: details(t),
      button: await myApplicationsButton(payload, a.userId, !account.loggedIn),
      footnote: account.loggedIn ? undefined : LINK_NOTE,
    }),
  );
}

/** Moved to another date (by the participant). */
export async function sendMoved(payload: Payload, a: Applicant, from: TargetInfo, to: TargetInfo) {
  await send(
    payload,
    a.email,
    `Áthelyezve: ${to.title}, ${to.when ?? ''}`.trim(),
    emailLayout({
      preheader: [to.title, to.when].filter(Boolean).join(' · '),
      heading: 'Áthelyeztük a jelentkezésed',
      paragraphs: [hello(a), 'A jelentkezésed átkerült az új időpontra.'],
      details: [
        { label: 'Mikor', value: to.when ?? '', was: from.when },
        ...(to.place ? [{ label: 'Hol', value: to.place }] : []),
      ],
      button: { label: 'Fiókom', href: siteUrl(MY_ACCOUNT) },
    }),
  );
}

/** Cancelled by the participant, or by staff. */
export async function sendCancellation(
  payload: Payload,
  s: ApplicationSettings,
  a: Applicant,
  t: TargetInfo,
  by: 'self' | 'staff',
) {
  await send(
    payload,
    a.email,
    `Lemondva: ${t.title}`,
    emailLayout({
      preheader: [t.title, t.when].filter(Boolean).join(' · '),
      heading: by === 'self' ? 'Lemondtad a jelentkezésed' : 'Lemondtuk a jelentkezésed',
      paragraphs: [
        hello(a),
        by === 'self'
          ? intro(s.texts, 'cancellation', 'Rögzítettük a lemondásod. Reméljük, legközelebb találkozunk!')
          : 'A jelentkezésed lemondtuk. Ha kérdésed van, írj nekünk.',
      ],
      details: details(t),
      button: { label: 'Fiókom', href: siteUrl(MY_ACCOUNT) },
    }),
  );
}

/** The workshop runs (at the cutoff). */
export async function sendWorkshopConfirmed(payload: Payload, s: ApplicationSettings, a: Applicant, t: TargetInfo) {
  await send(
    payload,
    a.email,
    `Biztosan indul: ${t.title}, ${t.when ?? ''}`.trim(),
    emailLayout({
      preheader: 'Megvan a létszám, találkozunk!',
      heading: 'Biztosan indul!',
      paragraphs: [
        hello(a),
        intro(
          s.texts,
          'confirmed',
          'Összegyűlt a szükséges létszám, az alkalom biztosan megvalósul. Várunk szeretettel!',
        ),
      ],
      details: details(t),
      button: await myApplicationsButton(payload, a.userId, true),
      footnote: LINK_NOTE,
    }),
  );
}

/** The workshop doesn't run (minimum not met), with the next open dates. */
export async function sendWorkshopCancelled(
  payload: Payload,
  s: ApplicationSettings,
  a: Applicant,
  t: TargetInfo,
  next: { when: string; left: string }[],
) {
  await send(
    payload,
    a.email,
    `Elmarad: ${t.title}, ${t.when ?? ''}`.trim(),
    emailLayout({
      preheader: 'Nem gyűlt össze a létszám — válassz másik időpontot.',
      heading: 'Elmarad az alkalom',
      paragraphs: [
        hello(a),
        intro(
          s.texts,
          'cancelledMinimum',
          'Sajnos erre az időpontra nem gyűlt össze a szükséges létszám, ezért az alkalom elmarad.',
        ),
        next.length
          ? 'A fiókodban egy kattintással átteheted a jelentkezésed egy másik időpontra:'
          : 'Új időpontokat hamarosan meghirdetünk a weboldalon.',
      ],
      details: [
        { label: 'Elmarad', value: t.when ?? t.title },
        ...next.map((n) => ({ label: 'Új időpont', value: `${n.when} (${n.left})` })),
      ],
      button: await myApplicationsButton(payload, a.userId, true),
      footnote: LINK_NOTE,
    }),
  );
}

/** Admitted into the course ("Felvétel a kurzusba"), with a login link. */
export async function sendAccepted(payload: Payload, s: ApplicationSettings, a: Applicant, t: TargetInfo) {
  let button = { label: 'Belépés a fiókomba', href: siteUrl('/fiokom') };
  try {
    const { url } = await createLoginLink(payload, a.userId, { ttlMs: APPLICATION_LINK_TTL_MS });
    button = { label: 'Belépés a fiókomba', href: `${url}&next=${encodeURIComponent('/fiokom')}` };
  } catch (err) {
    payload.logger.error({ err, msg: 'accepted e-mail: login link failed' });
  }
  await send(
    payload,
    a.email,
    `Felvételt nyertél: ${t.title}`,
    emailLayout({
      preheader: 'Üdv a csoportban!',
      heading: 'Üdv a csoportban!',
      paragraphs: [
        hello(a),
        intro(
          s.texts,
          'accepted',
          'Örömmel értesítünk, hogy felvettünk a kurzusra. A fiókodban megtalálod a csoport időpontjait és tudnivalóit.',
        ),
      ],
      details: details(t),
      button,
      footnote: LINK_NOTE,
    }),
  );
}

/** A message from staff to everyone registered for a date. */
export async function sendMessage(payload: Payload, a: Applicant, t: TargetInfo, subject: string, message: string) {
  await send(
    payload,
    a.email,
    subject,
    emailLayout({
      preheader: message.slice(0, 90),
      heading: subject,
      paragraphs: [
        hello(a),
        ...message
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean),
      ],
      details: details(t),
      button: { label: 'Fiókom', href: siteUrl(MY_ACCOUNT) },
    }),
  );
}

// ── to staff (notifyEmails) ─────────────────────────────────────────────────

export async function sendStaffNew(
  payload: Payload,
  s: ApplicationSettings,
  applicationId: number,
  kind: string,
  a: Applicant,
  t: TargetInfo,
  message?: string | null,
) {
  await send(
    payload,
    s.notifyEmails,
    `Új jelentkezés: ${a.name} — ${t.title}`,
    emailLayout({
      preheader: `${kind} · ${t.when ?? t.title}`,
      heading: 'Új jelentkezés',
      paragraphs: [`${a.name} jelentkezett (${kind}).`],
      details: [
        { label: 'Név', value: a.name },
        { label: 'E-mail', value: a.email },
        ...(a.phone ? [{ label: 'Telefon', value: a.phone }] : []),
        ...details(t),
        ...(message ? [{ label: 'Üzenet', value: message }] : []),
      ],
      button: { label: 'Megnyitás az adminban', href: siteUrl(`/admin/collections/applications/${applicationId}`) },
    }),
  );
}

export async function sendStaffCancellation(
  payload: Payload,
  s: ApplicationSettings,
  a: Applicant,
  t: TargetInfo,
  count: string,
  movedTo?: string,
) {
  await send(
    payload,
    s.notifyEmails,
    `${movedTo ? 'Áthelyezés' : 'Lemondás'}: ${a.name} — ${t.title}${t.when ? `, ${t.when}` : ''}`,
    emailLayout({
      preheader: count,
      heading: movedTo ? 'Egy résztvevő időpontot váltott' : 'Egy résztvevő lemondta',
      paragraphs: [movedTo ? `${a.name} áttette a jelentkezését: ${movedTo}.` : `${a.name} lemondta a jelentkezését.`],
      details: [
        { label: 'Név', value: a.name },
        { label: 'E-mail', value: a.email },
        ...details(t),
        { label: 'Létszám most', value: count },
      ],
    }),
  );
}
