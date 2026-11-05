import { getPages, getProductionsWithDetailPage, getSiteSettings, getUpcomingShows } from '@/lib/data';
import { showDateLine } from '@/lib/dates';
import { serverUrl } from '@/lib/env';

/**
 * /llms.txt (llmstxt.org): the site in Markdown for AI assistants — the pages, the productions and the
 * coming shows with their addresses, built from the CMS on each request (no database at build time).
 * The headings are the file's structure (not UI texts), in Hungarian like its content.
 */
export const dynamic = 'force-dynamic';

const item = (title: string, url: string, text?: string) => `- [${title}](${url})${text ? `: ${text}` : ''}`;

export async function GET() {
  const base = serverUrl();
  const [settings, pages, productions, shows] = await Promise.all([
    getSiteSettings(),
    getPages(),
    getProductionsWithDetailPage(),
    getUpcomingShows(),
  ]);
  const lines = [
    `# ${settings.name}`,
    '',
    `> ${settings.tagline}`,
    '',
    `${settings.contact.address} · ${settings.contact.email}`,
    '',
    '## Oldalak',
    '',
    ...pages.filter((p) => !p.noindex).map((p) => item(p.title, `${base}${p.path}`, p.meta.description)),
    '',
    '## Előadások',
    '',
    ...productions.map((p) => item(p.title, `${base}/repertoar/${p.slug}`, `${p.byline}. ${p.summary}`)),
    '',
    ...(shows.length
      ? [
          '## Közelgő előadások',
          '',
          ...shows.map((s) =>
            item(
              `${showDateLine(s.date, s.time)} — ${s.production.title}`,
              s.production.detailPage
                ? `${base}/repertoar/${s.production.slug}`
                : `${base}${settings.urls.upcomingShows}`,
              s.venue.name,
            ),
          ),
          '',
        ]
      : []),
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
