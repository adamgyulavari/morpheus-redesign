/**
 * The e-mails of sign-ups and applications. Their texts are in the admin (Beállítások → E-mailek,
 * payload/email-texts.ts); this fills them in: who, what, when, the rows and the button. Every
 * applicant e-mail leads to /fiokom — with a week-long login link when it goes to someone who may
 * not be logged in. A failed e-mail never fails what caused it; it is logged.
 */
import type { Payload } from 'payload';

import { formatHuf } from '@/lib/format';
import { momentText } from '@/lib/rooms/format';
import { fromTemplate, siteUrl } from '@/payload/email';
import { type Common, type EmailTextsRead, emailTexts } from '@/payload/email-texts';
import { APPLICATION_LINK_TTL_MS, createLoginLink } from '@/payload/magic-link';

import type { ApplicationSettings } from './settings';

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

/** The site's price format ("6000 Ft", "45 000 Ft"); undefined without a price. */
export const huf = (n: number | null | undefined) => (n == null ? undefined : formatHuf(n));

export type Row = { label: string; value: string; was?: string };

/** The rows about the date or course (labels: E-mailek → Közös). */
export const details = (c: Common, t: TargetInfo, extra: Row[] = []): Row[] => [
  { label: c.labelWhat, value: t.title },
  ...(t.when ? [{ label: c.labelWhen, value: t.when }] : []),
  ...(t.place ? [{ label: c.labelWhere, value: t.place }] : []),
  ...(t.price ? [{ label: c.labelPrice, value: t.price }] : []),
  ...extra,
];

/** The placeholders every sign-up e-mail can use. */
export const varsOf = (a: Applicant, t: TargetInfo) => ({
  keresztnev: a.firstName?.trim(),
  nev: a.name,
  email: a.email,
  cim: t.title,
  mikor: t.when,
  hol: t.place,
});

/** Sends (never throws: a failed e-mail is logged). `ics`: a calendar file attached. */
export async function send(
  payload: Payload,
  to: string | string[],
  e: { subject: string; html: string },
  ics?: string,
) {
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!list.length) return;
  try {
    await payload.sendEmail({
      to: list,
      subject: e.subject,
      html: e.html,
      ...(ics
        ? {
            attachments: [
              { filename: 'alkalom.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' },
            ],
          }
        : {}),
    });
  } catch (err) {
    payload.logger.error({ err, msg: `application e-mail failed: ${e.subject}` });
  }
}

/** The account's address for the button: a login link for those who may not be logged in. */
export async function myAccountLink(payload: Payload, userId: number, login: boolean) {
  if (!login) return siteUrl(MY_ACCOUNT);
  try {
    const { url } = await createLoginLink(payload, userId, { ttlMs: APPLICATION_LINK_TTL_MS });
    return `${url}&next=${encodeURIComponent(MY_ACCOUNT)}`;
  } catch (err) {
    payload.logger.error({ err, msg: 'application e-mail: login link failed' });
    return siteUrl(MY_ACCOUNT);
  }
}

/** One applicant e-mail: its template, the person, the rows, the account button. */
async function toApplicant(
  payload: Payload,
  texts: EmailTextsRead,
  key: string,
  a: Applicant,
  t: TargetInfo,
  o: {
    vars?: Record<string, string | number | undefined>;
    after?: string[];
    rows?: Row[];
    login?: boolean;
    href?: string;
  } = {},
  ics?: string,
) {
  const login = o.login ?? false;
  await send(
    payload,
    a.email,
    fromTemplate(
      texts,
      key,
      { ...varsOf(a, t), ...o.vars },
      {
        greet: { firstName: a.firstName },
        after: o.after,
        details: o.rows ?? details(texts.common, t),
        href: o.href ?? (await myAccountLink(payload, a.userId, login)),
        footnote: login ? texts.common.loginLinkNote : undefined,
      },
    ),
    ics,
  );
}

// ── to the applicant ────────────────────────────────────────────────────────

/** Workshop or beginner sign-up received (without online payment); professional application received. */
export async function sendReceived(
  payload: Payload,
  s: ApplicationSettings,
  a: Applicant,
  kind: 'workshop' | 'beginner' | 'professional',
  t: TargetInfo,
  account: { created: boolean; loggedIn: boolean },
) {
  const texts = await emailTexts(payload);
  const key =
    kind === 'professional'
      ? 'applicationReceived'
      : kind === 'workshop'
        ? 'signupWorkshop'
        : t.withoutGroup
          ? 'signupBeginnerNoGroup'
          : 'signupBeginner';
  await toApplicant(payload, texts, key, a, t, {
    vars: {
      minimum: t.minParticipants,
      dontes: t.cutoff ? momentText(t.cutoff) : undefined,
      lemondas: s.userCancelHours,
    },
    after: [account.created ? texts.common.accountCreated : texts.common.accountExisting],
    login: !account.loggedIn,
  });
}

/** Moved to another date (by the participant). */
export async function sendMoved(payload: Payload, a: Applicant, from: TargetInfo, to: TargetInfo) {
  const texts = await emailTexts(payload);
  const c = texts.common;
  await toApplicant(payload, texts, 'moved', a, to, {
    vars: { regi: from.when },
    rows: [
      { label: c.labelWhen, value: to.when ?? '', was: from.when },
      ...(to.place ? [{ label: c.labelWhere, value: to.place }] : []),
    ],
  });
}

/** Cancelled by the participant, or by staff. */
export async function sendCancellation(
  payload: Payload,
  _s: ApplicationSettings,
  a: Applicant,
  t: TargetInfo,
  by: 'self' | 'staff',
) {
  await toApplicant(payload, await emailTexts(payload), by === 'self' ? 'cancelledBySelf' : 'cancelledByStaff', a, t);
}

/** The workshop runs (at the cutoff). */
export async function sendWorkshopConfirmed(payload: Payload, _s: ApplicationSettings, a: Applicant, t: TargetInfo) {
  await toApplicant(payload, await emailTexts(payload), 'workshopConfirmed', a, t, { login: true });
}

/** The workshop doesn't run (minimum not met), with the next open dates. */
export async function sendWorkshopCancelled(
  payload: Payload,
  _s: ApplicationSettings,
  a: Applicant,
  t: TargetInfo,
  next: { when: string; left: string }[],
) {
  const texts = await emailTexts(payload);
  const tpl = texts.template('workshopCancelled');
  await toApplicant(payload, texts, 'workshopCancelled', a, t, {
    after: [(next.length ? tpl.nextDates : tpl.noNextDates) ?? ''].filter(Boolean),
    rows: [
      { label: tpl.cancelledLabel ?? '', value: t.when ?? t.title },
      ...next.map((n) => ({ label: tpl.nextLabel ?? '', value: `${n.when} (${n.left})` })),
    ],
    login: true,
  });
}

/** Admitted into the course ("Felvétel a kurzusba"), with a login link. */
export async function sendAccepted(
  payload: Payload,
  _s: ApplicationSettings,
  a: Applicant,
  t: TargetInfo,
  /** More rows, e.g. what was paid at the checkout. */
  extra: Row[] = [],
) {
  const texts = await emailTexts(payload);
  await toApplicant(payload, texts, 'accepted', a, t, { rows: details(texts.common, t, extra), login: true });
}

/** A message from staff to everyone registered for a date (their own words; the layout's button). */
export async function sendMessage(payload: Payload, a: Applicant, t: TargetInfo, subject: string, message: string) {
  const texts = await emailTexts(payload);
  const c = texts.common;
  const e = fromTemplate(
    // the staff's own message: the shared parts only (greeting, rows, the account button)
    { common: c, template: () => ({ subject, heading: subject, text: message, button: c.myAccountButton }) },
    'message',
    {},
    { greet: { firstName: a.firstName }, details: details(c, t), href: siteUrl(MY_ACCOUNT) },
  );
  await send(payload, a.email, e);
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
  const texts = await emailTexts(payload);
  const c = texts.common;
  await send(
    payload,
    s.notifyEmails,
    fromTemplate(
      texts,
      'staffNew',
      { ...varsOf(a, t), fajta: kind },
      {
        greet: false,
        details: [
          { label: c.labelName, value: a.name },
          { label: c.labelEmail, value: a.email },
          ...(a.phone ? [{ label: c.labelPhone, value: a.phone }] : []),
          ...details(c, t),
          ...(message ? [{ label: c.labelMessage, value: message }] : []),
        ],
        href: siteUrl(`/admin/collections/applications/${applicationId}`),
      },
    ),
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
  const texts = await emailTexts(payload);
  const c = texts.common;
  await send(
    payload,
    s.notifyEmails,
    fromTemplate(
      texts,
      movedTo ? 'staffMoved' : 'staffCancelled',
      { ...varsOf(a, t), regi: t.when, ...(movedTo ? { mikor: movedTo } : {}) },
      {
        greet: false,
        details: [
          { label: c.labelName, value: a.name },
          { label: c.labelEmail, value: a.email },
          ...details(c, t),
          { label: c.labelCount, value: count },
        ],
      },
    ),
  );
}
