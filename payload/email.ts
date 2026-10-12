/**
 * Transactional e-mail: one SMTP setup (Scaleway TEM in production) and one shared Hungarian
 * layout. Without SMTP_HOST, e-mails are written to the console with their links, so the flows
 * can be followed locally (or use Mailpit from docker-compose.dev.yml, see .env.example).
 *
 * The layout uses tables and inline styles: e-mail clients ignore most CSS. The colours are the
 * site's tokens (app/(frontend)/globals.css).
 */
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import type { EmailAdapter } from 'payload';

import { serverUrl } from '@/lib/env';

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
};

export function emailLayout({ preheader, heading, paragraphs, button, code, footnote, details }: Layout): string {
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
      <p style="margin:0 0 16px;font:13px/1.6 ${FONT};color:${C.muted}">Ha a gomb nem működik, másold be ezt a címet a böngésződbe:<br><a href="${escapeHtml(button.href)}" style="color:${C.teal};word-break:break-all">${escapeHtml(button.href)}</a></p>`
    : '';
  const codeBlock = code
    ? `<p style="margin:8px 0 8px;font:16px/1.6 ${FONT};color:${C.ink2}">${escapeHtml(code.intro)}</p>
      <p style="margin:0 0 24px;padding:14px 20px;background:${C.cream};border:1px solid ${C.line};border-radius:16px;text-align:center;font:700 32px/1 ${FONT};letter-spacing:8px;color:${C.deep}">${escapeHtml(code.value)}</p>`
    : '';
  const note = footnote ? `<p style="margin:0;font:13px/1.6 ${FONT};color:${C.muted}">${escapeHtml(footnote)}</p>` : '';
  return `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.cream}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 0 24px">
      <a href="${escapeHtml(siteUrl('/'))}" style="text-decoration:none;color:${C.ink}">
        <img src="${escapeHtml(siteUrl('/email/logo.png'))}" width="48" height="48" alt="" style="vertical-align:middle;border:0">
        <span style="vertical-align:middle;margin-left:10px;font:28px/1 Georgia, 'Times New Roman', serif;color:${C.ink}">Morpheus</span>
        <span style="vertical-align:middle;margin-left:6px;font:700 10px/1 ${FONT};letter-spacing:3px;text-transform:uppercase;color:${C.teal}">Színműhely</span>
      </a>
    </td></tr>
    <tr><td style="background:${C.paper};border:1px solid ${C.line};border-radius:24px;padding:32px 28px">
      <h1 style="margin:0 0 20px;font:400 32px/1.1 Georgia, 'Times New Roman', serif;color:${C.ink}">${escapeHtml(heading)}</h1>
      ${paragraphs.map(p).join('\n      ')}
      ${rows}
      ${cta}
      ${codeBlock}
      ${note}
    </td></tr>
    <tr><td style="padding:20px 8px 0;font:12px/1.6 ${FONT};color:${C.muted}">
      Ezt a levelet a Morpheus Színműhely rendszere küldte automatikusan, kérjük, ne válaszolj rá.<br>
      <a href="${escapeHtml(siteUrl('/'))}" style="color:${C.muted}">${escapeHtml(serverUrl().replace(/^https?:\/\//, '') || 'morpheus-szinmuhely.hu')}</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

type Recipient = { firstName?: string | null } | null | undefined;
const hello = (user: Recipient) => (user?.firstName ? `Kedves ${user.firstName}!` : 'Kedves Hallgatónk!');

export const verifyEmail = {
  subject: 'Erősítsd meg az e-mail-címed',
  html: (token: string, user: Recipient) =>
    emailLayout({
      preheader: 'Egy kattintás, és kész a Morpheus-fiókod.',
      heading: 'Erősítsd meg az e-mail-címed',
      paragraphs: [
        hello(user),
        'Köszönjük, hogy regisztráltál a Morpheus Színműhely oldalán. A fiókod használatához erősítsd meg az e-mail-címed az alábbi gombbal.',
      ],
      button: {
        label: 'E-mail-cím megerősítése',
        href: siteUrl(`/email-megerosites?token=${encodeURIComponent(token)}`),
      },
      footnote: 'Ha nem te regisztráltál, nyugodtan hagyd figyelmen kívül ezt a levelet.',
    }),
};

export const resetPassword = {
  subject: 'Új jelszó beállítása',
  html: (token: string, user: Recipient) =>
    emailLayout({
      preheader: 'Állíts be új jelszót a Morpheus-fiókodhoz.',
      heading: 'Új jelszó beállítása',
      paragraphs: [
        hello(user),
        'Valaki (remélhetőleg te) új jelszót kért a Morpheus-fiókodhoz. Az alábbi gombbal állíthatod be.',
      ],
      button: {
        label: 'Új jelszó beállítása',
        href: siteUrl(`/jelszo-visszaallitas?token=${encodeURIComponent(token)}`),
      },
      footnote:
        'A link egy órán át érvényes. Ha nem te kérted, hagyd figyelmen kívül ezt a levelet: a jelszavad nem változik.',
    }),
};

export const magicLink = {
  subject: 'Belépési link',
  html: (href: string, code: string, user: Recipient) =>
    emailLayout({
      preheader: `Belépési kódod: ${code}`,
      heading: 'Belépés jelszó nélkül',
      paragraphs: [hello(user), 'Az alábbi gombbal jelszó nélkül beléphetsz a Morpheus-fiókodba.'],
      button: { label: 'Belépés', href },
      code: {
        intro: 'Ha a belépést egy másik eszközön kérted, ott ezt a kódot írd be:',
        value: `${code.slice(0, 3)} ${code.slice(3)}`,
      },
      footnote:
        'A link és a kód 15 percig érvényes, és csak egyszer használható. Ha nem te kérted, hagyd figyelmen kívül ezt a levelet.',
    }),
};
