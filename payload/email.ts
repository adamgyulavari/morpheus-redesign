/**
 * Transactional e-mail: one SMTP setup (Scaleway TEM in production) and one shared Hungarian
 * layout. Without SMTP_HOST, e-mails are written to the console with their links, so the flows
 * can be followed locally (or use Mailpit from docker-compose.dev.yml, see .env.example).
 *
 * The layout uses tables and inline styles: e-mail clients ignore most CSS. The colours are the
 * site's tokens (app/(frontend)/globals.css).
 */
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import type { EmailAdapter, Payload } from 'payload';

import { serverUrl } from '@/lib/env';

import { type EmailTextsRead, emailTexts, fill, paragraphs } from './email-texts';

/**
 * Development fallback. Payload's own console adapter prints only the subject; this one also
 * prints the e-mail's links (verification, password reset, login link).
 */
const consoleAdapter: EmailAdapter = ({ payload }) => ({
  name: 'console',
  defaultFromAddress: process.env.EMAIL_FROM || 'noreply@morpheus-szinmuhely.hu',
  defaultFromName: process.env.EMAIL_FROM_NAME || 'Morpheus Színműhely',
  sendEmail: async (message) => {
    const to = Array.isArray(message.to)
      ? message.to.join(', ')
      : String(typeof message.to === 'object' ? message.to?.address : message.to);
    const home = `${serverUrl()}/`;
    const links = [...String(message.html ?? '').matchAll(/href="([^"]+)"/g)]
      .map(([, href = '']) => href.replace(/&amp;/g, '&'))
      .filter((href, i, all) => href !== home && all.indexOf(href) === i);
    payload.logger.info(
      [`E-mail (not sent: no SMTP_HOST) to ${to}: ${message.subject}`, ...links.map((l) => `  → ${l}`)].join('\n'),
    );
  },
});

export function emailAdapter(): Promise<EmailAdapter> | EmailAdapter {
  const host = process.env.SMTP_HOST;
  if (!host) return consoleAdapter;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  return nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || 'noreply@morpheus-szinmuhely.hu',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Morpheus Színműhely',
    // the server is not contacted at start-up; a wrong setting shows when the first e-mail fails
    skipVerify: true,
    transportOptions: {
      host,
      port,
      // 465: TLS from the start; 587/2587: STARTTLS
      secure: port === 465,
      auth: user ? { user, pass: process.env.SMTP_PASS } : undefined,
    },
  });
}

const C = {
  cream: '#f7f1e8',
  paper: '#fffaf2',
  line: '#e4d8c6',
  ink: '#10292c',
  ink2: '#33494c',
  muted: '#4d6366',
  teal: '#0f5f63',
  deep: '#0b3a3f',
};
const FONT = "'Segoe UI', Helvetica, Arial, sans-serif";

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** An absolute link to a page of the public site. */
export const siteUrl = (path: string) => `${serverUrl()}${path}`;

type Layout = {
  /** Shown in the inbox list after the subject. */
  preheader: string;
  heading: string;
  /** Plain text; escaped here. */
  paragraphs: string[];
  button?: { label: string; href: string };
  /** A one-time code shown large under the button, with a line introducing it. */
  code?: { intro: string; value: string };
  /** Small print under the button, e.g. "the link expires in 15 minutes". */
  footnote?: string;
  /** Label / value rows under the paragraphs ("Mikor", "Hol"…); `was` shows a crossed-out old value. */
  details?: { label: string; value: string; was?: string }[];
  /** A show's tickets: each one's QR code (an inline attachment: `cid`), its caption and link. */
  tickets?: { cid: string; caption: string; href: string }[];
  /** The layout's own lines (E-mailek → Közös): under the button, the footer. */
  chrome: { buttonHelp: string; footer: string };
};

export function emailLayout({
  preheader,
  heading,
  paragraphs,
  button,
  code,
  footnote,
  details,
  tickets,
  chrome,
}: Layout): string {
  const p = (text: string) =>
    `<p style="margin:0 0 16px;font:16px/1.6 ${FONT};color:${C.ink2}">${escapeHtml(text)}</p>`;
  const rows = details?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;border-top:1px solid ${C.line}">${details
        .map(
          (d) => `<tr>
        <td style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.line};font:600 14px/1.5 ${FONT};color:${C.muted};vertical-align:top;white-space:nowrap">${escapeHtml(d.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${C.line};font:16px/1.5 ${FONT};color:${C.ink}">${escapeHtml(d.value)}${
          d.was
            ? `<br><span style="font-size:14px;color:${C.muted};text-decoration:line-through">${escapeHtml(d.was)}</span>`
            : ''
        }</td>
      </tr>`,
        )
        .join('')}</table>`
    : '';
  const cta = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${C.teal}">
        <a href="${escapeHtml(button.href)}" style="display:inline-block;padding:14px 28px;font:600 16px/1 ${FONT};color:${C.cream};text-decoration:none;border-radius:999px">${escapeHtml(button.label)}</a>
      </td></tr></table>
      <p style="margin:0 0 16px;font:13px/1.6 ${FONT};color:${C.muted}">${escapeHtml(chrome.buttonHelp)}<br><a href="${escapeHtml(button.href)}" style="color:${C.teal};word-break:break-all">${escapeHtml(button.href)}</a></p>`
    : '';
  const codeBlock = code
    ? `<p style="margin:8px 0 8px;font:16px/1.6 ${FONT};color:${C.ink2}">${escapeHtml(code.intro)}</p>
      <p style="margin:0 0 24px;padding:14px 20px;background:${C.cream};border:1px solid ${C.line};border-radius:16px;text-align:center;font:700 32px/1 ${FONT};letter-spacing:8px;color:${C.deep}">${escapeHtml(code.value)}</p>`
    : '';
  const ticketBlock = tickets?.length
    ? tickets
        .map(
          (
            t,
          ) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;text-align:center"><tr><td style="padding:16px;background:#ffffff;border:1px solid ${C.line};border-radius:16px">
        <a href="${escapeHtml(t.href)}"><img src="cid:${escapeHtml(t.cid)}" width="180" height="180" alt="${escapeHtml(t.caption)}" style="display:block;border:0"></a>
        <p style="margin:10px 0 0;font:600 14px/1.4 ${FONT};color:${C.ink}">${escapeHtml(t.caption)}</p>
      </td></tr></table>`,
        )
        .join('\n      ')
    : '';
  const note = footnote ? `<p style="margin:0;font:13px/1.6 ${FONT};color:${C.muted}">${escapeHtml(footnote)}</p>` : '';
  return `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.cream}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 0 24px">
      <!-- the logo beside the name, as in the site's header: table cells centre it in every client -->
      <a href="${escapeHtml(siteUrl('/'))}" style="text-decoration:none;color:${C.ink}">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;padding:0 12px 0 0"><img src="${escapeHtml(siteUrl('/email/logo.png'))}" width="48" height="48" alt="" style="display:block;border:0"></td>
          <td style="vertical-align:middle">
            <div style="font:28px/1 Georgia, 'Times New Roman', serif;color:${C.ink}">Morpheus</div>
            <div style="padding-top:4px;font:700 10px/1 ${FONT};letter-spacing:3px;text-transform:uppercase;color:${C.teal}">Színműhely</div>
          </td>
        </tr></table>
      </a>
    </td></tr>
    <tr><td style="background:${C.paper};border:1px solid ${C.line};border-radius:24px;padding:32px 28px">
      <h1 style="margin:0 0 20px;font:400 32px/1.1 Georgia, 'Times New Roman', serif;color:${C.ink}">${escapeHtml(heading)}</h1>
      ${paragraphs.map(p).join('\n      ')}
      ${rows}
      ${ticketBlock}
      ${cta}
      ${codeBlock}
      ${note}
    </td></tr>
    <tr><td style="padding:20px 8px 0;font:12px/1.6 ${FONT};color:${C.muted}">
      ${escapeHtml(chrome.footer)}<br>
      <a href="${escapeHtml(siteUrl('/'))}" style="color:${C.muted}">${escapeHtml(serverUrl().replace(/^https?:\/\//, '') || 'morpheus-szinmuhely.hu')}</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

// ── from the texts (E-mailek, payload/email-texts.ts) ───────────────────────

type Row = { label: string; value: string; was?: string };

/**
 * An e-mail from its template: the greeting, the text's paragraphs (placeholders filled), the
 * rows, the button (its label from the template), a code, the footnote.
 */
export function fromTemplate(
  texts: EmailTextsRead,
  key: string,
  vars: Record<string, string | number | null | undefined>,
  o: {
    /** The recipient's first name for the greeting; false: no greeting (staff e-mails). */
    greet?: { firstName?: string | null } | false;
    /** More paragraphs after the text (already filled). */
    after?: string[];
    details?: Row[];
    href?: string;
    /** A one-time code under the button (its intro: the template's `codeIntro`). */
    code?: string;
    /** Instead of the template's footnote (e.g. the login link's note). */
    footnote?: string;
    /** A show's tickets (their QR codes, attached inline by the sender). */
    tickets?: { cid: string; n: number; href: string }[];
  } = {},
): { subject: string; html: string } {
  const t = texts.template(key);
  const c = texts.common;
  const first = o.greet ? o.greet.firstName?.trim() : undefined;
  const greeting =
    o.greet === false ? [] : [first ? fill(c.greeting, { ...vars, keresztnev: first }) : c.greetingNoName];
  return {
    subject: fill(t.subject, vars),
    html: emailLayout({
      preheader: fill(t.preheader || t.subject, vars),
      heading: fill(t.heading, vars),
      paragraphs: [...greeting, ...paragraphs(t.text, vars), ...(o.after ?? [])],
      details: o.details,
      tickets: o.tickets?.map((t) => ({ cid: t.cid, href: t.href, caption: fill(c.labelTicket, { n: t.n }) })),
      button: o.href && t.button ? { label: fill(t.button, vars), href: o.href } : undefined,
      code: o.code ? { intro: fill(t.codeIntro, vars), value: o.code } : undefined,
      footnote: o.footnote ?? (t.footnote ? fill(t.footnote, vars) : undefined),
      chrome: { buttonHelp: c.buttonHelp, footer: c.footer },
    }),
  };
}

type Recipient = { firstName?: string | null } | null | undefined;

/** E-mail address confirmation (Payload's verify e-mail). */
export async function verifyEmail(payload: Payload, token: string, user: Recipient) {
  return fromTemplate(
    await emailTexts(payload),
    'verifyEmail',
    { keresztnev: user?.firstName },
    {
      greet: { firstName: user?.firstName },
      href: siteUrl(`/email-megerosites?token=${encodeURIComponent(token)}`),
    },
  );
}

/** A new password (Payload's forgot-password e-mail). */
export async function resetPassword(payload: Payload, token: string, user: Recipient) {
  return fromTemplate(
    await emailTexts(payload),
    'resetPassword',
    { keresztnev: user?.firstName },
    {
      greet: { firstName: user?.firstName },
      href: siteUrl(`/jelszo-visszaallitas?token=${encodeURIComponent(token)}`),
    },
  );
}

/** The login link with its one-time code. */
export async function magicLink(payload: Payload, href: string, code: string, user: Recipient) {
  const kod = `${code.slice(0, 3)} ${code.slice(3)}`;
  return fromTemplate(
    await emailTexts(payload),
    'magicLink',
    { keresztnev: user?.firstName, kod },
    {
      greet: { firstName: user?.firstName },
      href,
      code: kod,
    },
  );
}
