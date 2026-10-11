/**
 * Imports the original static content into Payload: `npm run seed`.
 *
 * Reads content/*.json, content/pages/*.json, content/legal/*.md and the files in public/images
 * and public/video. Idempotent: every record keeps its old id in `importId`, so running it again
 * updates the existing documents instead of creating duplicates (media files are uploaded once).
 * Also creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when there are no users.
 *
 * The content JSON is the import source only — the site reads everything from Payload.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import config from '@payload-config';
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { getPayload, type CollectionSlug, type Payload } from 'payload';

import { firstSentence } from '@/lib/format';
import { fullRichText } from '@/payload/fields';

const root = process.cwd();
const json = async <T>(file: string): Promise<T> => JSON.parse(await readFile(path.join(root, 'content', file), 'utf-8')) as T;
const ctx = { disableRevalidate: true };

type Img = { src: string; alt: string };
type Id = number;
type Obj = Record<string, unknown>;

// Stored days are noon UTC, like the admin's date picker (noon local) — the same Budapest day.
const day = (d: string) => `${d.length === 7 ? `${d}-01` : d}T12:00:00.000Z`;

// ── lexical ─────────────────────────────────────────────────────────────────

const textNode = (text: string) => ({ type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' });
const inline = (text: string) => text.split('\n').flatMap((line, i) => [...(i ? [{ type: 'linebreak', version: 1 }] : []), ...(line ? [textNode(line)] : [])]);
const paragraph = (children: unknown[]) => ({ type: 'paragraph', version: 1, children, direction: 'ltr', format: '', indent: 0, textFormat: 0, textStyle: '' });
const lexical = (children: unknown[]) => ({ root: { type: 'root', version: 1, children, direction: 'ltr', format: '', indent: 0 } });

/** Paragraph strings → rich text (one paragraph each; "\n" becomes a line break). */
const richParagraphs = (paras: string[]) => lexical(paras.map((p) => paragraph(inline(p))));

/** Text segments with links → a rich-text paragraph with link nodes. */
const richSegments = (segments: { text: string; href?: string }[]) =>
  lexical([
    paragraph(
      segments.flatMap((s) =>
        s.href
          ? [{ type: 'link', version: 3, fields: { linkType: 'custom', url: s.href, newTab: false }, children: [textNode(s.text)], direction: 'ltr', format: '', indent: 0 }]
          : inline(s.text),
      ),
    ),
  ]);

// ── upserts ─────────────────────────────────────────────────────────────────

async function upsert(payload: Payload, collection: CollectionSlug, importId: string, data: Obj, drafts = false): Promise<Id> {
  const { docs } = await payload.find({ collection, where: { importId: { equals: importId } }, limit: 1, depth: 0, draft: drafts, context: ctx });
  const body = { ...data, importId, ...(drafts ? { _status: 'published' } : {}) } as never;
  const doc = docs[0]
    ? await payload.update({ collection, id: docs[0].id, data: body, depth: 0, context: ctx })
    : await payload.create({ collection, data: body, depth: 0, context: ctx });
  return doc.id as Id;
}

function mediaUploader(payload: Payload) {
  const ids = new Map<string, Id>();
  const alts = new Map<string, string>();
  // One upload at a time: callers use Promise.all, and parallel creates race on Payload's
  // unique-filename check (both see the name free, the second insert fails).
  let queue: Promise<unknown> = Promise.resolve();

  async function upload(src: string, text: string): Promise<Id> {
    const known = ids.get(src);
    if (known) {
      if (alts.get(src) !== text) payload.logger.warn(`${src}: used with another alt text too ("${text}"); keeping "${alts.get(src)}"`);
      return known;
    }
    // by filename too: a file uploaded by hand (or by an earlier run) would otherwise clash on it
    const { docs } = await payload.find({
      collection: 'media',
      where: { or: [{ importId: { equals: src } }, { filename: { equals: path.basename(src) } }] },
      limit: 1,
      depth: 0,
    });
    try {
      const id = docs[0]
        ? (await payload.update({ collection: 'media', id: docs[0].id, data: { alt: text, importId: src }, depth: 0, context: ctx })).id
        : (await payload.create({ collection: 'media', data: { alt: text, importId: src }, filePath: path.join(root, 'public', src), depth: 0, context: ctx })).id;
      ids.set(src, id);
      alts.set(src, text);
      return id;
    } catch (err) {
      payload.logger.error(`media ${src} failed (${docs[0] ? `updating #${docs[0].id}` : 'creating'})`);
      throw err;
    }
  }

  /** The media id of a /images/… or /video/… file, uploaded once (first alt text wins). */
  return function media(ref: Img | string | undefined, alt?: string): Promise<Id | undefined> {
    if (!ref) return Promise.resolve(undefined);
    const src = typeof ref === 'string' ? ref : ref.src;
    const text = typeof ref === 'string' ? (alt ?? path.basename(src)) : ref.alt;
    const result = queue.then(() => upload(src, text));
    queue = result.catch(() => undefined);
    return result;
  };
}

// ── run ─────────────────────────────────────────────────────────────────────

async function seed() {
  // Payload checks the local upload folder for name clashes even when files go to S3: with the dev
  // ./media present, every upload would be renamed (photo.jpg → photo-1.jpg).
  if (process.env.S3_BUCKET && (await readdir(path.join(root, 'media')).catch(() => [])).length) {
    throw new Error('S3_BUCKET is set but ./media has files: move ./media aside (e.g. mv media media.local) before seeding.');
  }
  const payload = await getPayload({ config });
  const db = new URL(process.env.DATABASE_URL ?? 'postgres://unset');
  payload.logger.info(`seeding ${db.host}${db.pathname}, media ${process.env.S3_BUCKET ? `→ s3://${process.env.S3_BUCKET}` : '→ ./media'}`);
  const media = mediaUploader(payload);
  const log = (what: string, n: number) => payload.logger.info(`seeded ${n} ${what}`);
  const ids: Record<string, Map<string, Id>> = {};
  const idOf = (kind: string, old: string): Id => {
    const id = ids[kind]?.get(old);
    if (id === undefined) throw new Error(`Unknown ${kind} "${old}"`);
    return id;
  };
  async function each<T extends { id: string }>(kind: string, collection: CollectionSlug, items: T[], toData: (item: T, index: number) => Promise<Obj> | Obj, drafts = false) {
    ids[kind] = new Map();
    for (const [i, item] of items.entries()) ids[kind].set(item.id, await upsert(payload, collection, `${kind}:${item.id}`, await toData(item, i), drafts));
    log(kind, items.length);
  }
  const texts = (list?: string[]) => (list ?? []).map((text) => ({ text }));

  type Any = Obj & { id: string };

  await each('venue', 'venues', await json<Any[]>('venues.json'), (v) => ({ name: v.name, shortName: v.shortName }));
  await each('contactPerson', 'contactPeople', await json<Any[]>('contact-people.json'), async (c, i) => ({
    name: c.name,
    role: c.role,
    phone: c.phone,
    photo: await media(c.photo as Img),
    order: i + 1,
  }));
  await each('review', 'reviews', await json<Any[]>('reviews.json'), async (r, i) => ({
    name: r.name,
    label: r.label,
    quote: r.quote,
    fullText: texts(r.fullText as string[]),
    photo: await media(r.photo as Img),
    order: i + 1,
  }));
  await each('instructor', 'instructors', await json<Any[]>('instructors.json'), async (r) => ({
    name: r.name,
    role: r.role,
    bio: texts(r.bio as string[]),
    photo: await media(r.photo as Img),
    order: r.order,
  }));
  await each('programme', 'teamBuildingProgrammes', await json<Any[]>('team-building-programmes.json'), (t, i) => ({
    name: t.name,
    duration: t.duration,
    venue: t.venue,
    description: texts(t.description as string[]),
    order: i + 1,
  }));
  await each('course', 'courses', await json<Any[]>('courses.json'), (c) => ({
    ...c,
    id: undefined,
    starts: (c.starts as Obj[]).map((s) => ({ date: day(s.date as string), startTime: s.startTime, endTime: s.endTime })),
    nextIntake: c.nextIntake ? day(c.nextIntake as string) : null,
    prices: (c.prices as Obj[]).map(({ id: _, ...p }) => p),
  }));
  await each('session', 'openWorkshopSessions', await json<Any[]>('open-workshop-sessions.json'), (s) => ({
    ...s,
    id: undefined,
    date: day(s.date as string),
    bookingDeadline: day(s.bookingDeadline as string),
  }));
  await each('workshop', 'workshops', await json<Any[]>('workshops.json'), async (w) => ({
    ...w,
    id: undefined,
    startDate: day(w.startDate as string),
    endDate: day(w.endDate as string),
    leader: w.leader ? { name: (w.leader as Obj).name, bio: texts((w.leader as Obj).bio as string[]) } : undefined,
    image: await media(w.image as Img),
    gallery: await Promise.all((w.gallery as Img[]).map((g) => media(g))),
  }));
  await each('ctaBand', 'ctaBands', await json<Any[]>('cta-bands.json'), (c) => ({ ...c, id: undefined, name: c.id }));

  // legal pages: Markdown → Lexical (the "# Title" line becomes the title field)
  const legalEditor = await editorConfigFactory.fromEditor({ config: payload.config, editor: fullRichText });
  const legalSlugs = ['adatkezelesi-tajekoztato'];
  await each(
    'legal',
    'legalPages',
    legalSlugs.map((id) => ({ id })),
    async ({ id }) => {
      const md = await readFile(path.join(root, 'content', 'legal', `${id}.md`), 'utf-8');
      const title = md.match(/^# (.+)$/m)?.[1]?.trim() ?? id;
      const effective = md.match(/(\d{4})\. (január|február|március|április|május|június|július|augusztus|szeptember|október|november|december) (\d{1,2})\. napján lép hatályba/);
      const months = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
      return {
        title,
        slug: id,
        effectiveDate: effective ? day(`${effective[1]}-${String(months.indexOf(effective[2]!) + 1).padStart(2, '0')}-${effective[3]!.padStart(2, '0')}`) : null,
        body: convertMarkdownToLexical({ editorConfig: legalEditor, markdown: md.replace(/^# .+\n+/m, '') }),
      };
    },
    true,
  );

  const siteName = (await json<{ name: string }>('site-settings.json')).name;
  const productions = await json<Any[]>('productions.json');
  await each(
    'production',
    'productions',
    productions,
    async (p, i) => {
      const invite = p.inviteVideo as { src: string; title: string; poster: Img } | undefined;
      return {
        ...p,
        id: undefined,
        order: i + 1,
        generateSlug: false,
        // SEO: what the production page has shown so far (title, first sentence of the story);
        // no image, so sharing keeps using the full poster
        meta: p.detailPage
          ? { title: `${p.title} — ${siteName}`, description: firstSentence((p.longDescription as string[])[0] ?? (p.summary as string)) }
          : undefined,
        longDescription: richParagraphs(p.longDescription as string[]),
        // the media library requires alt text; untitled posters get "<title> — plakát", like the others
        poster: await media({ ...(p.poster as Img), alt: (p.poster as Img).alt || `${p.title} — plakát` }),
        heroImage: await media(p.heroImage as Img | undefined),
        heroVideo: await media(p.heroVideo as string | undefined, `${p.title} — háttérvideó`),
        gallery: await Promise.all(((p.gallery as Img[] | undefined) ?? []).map((g) => media(g))),
        inviteVideo: invite ? { video: await media(invite.src, invite.title), title: invite.title, poster: await media(invite.poster) } : undefined,
      };
    },
    true,
  );
  await each('show', 'shows', await json<Any[]>('shows.json'), (s) => ({
    production: idOf('production', s.productionId as string),
    venue: idOf('venue', s.venueId as string),
    date: day(s.date as string),
    time: s.time,
    label: s.label,
    ticketUrl: s.ticketUrl,
    registrationUrl: s.registrationUrl,
    info: texts(s.info as string[] | undefined),
  }));

  // pages: first make sure every page exists (the course switcher references pages by path)
  const files = ['home', 'rolunk', 'kepzesek', 'kezdo-kurzus', 'szakmai-kurzus', 'nyitott-alkalmak', 'repertoar', 'kozelgo-eloadasok', 'csapatepito', 'kapcsolat', 'oktatok', 'adatkezelesi-tajekoztato', 'bio'];
  const pages = await Promise.all(files.map((f) => json<Obj & { path: string; blocks: Obj[] }>(`pages/${f}.json`)));
  const pageIds = new Map<string, Id>();
  for (const p of pages) {
    const { docs } = await payload.find({ collection: 'pages', where: { importId: { equals: `page:${p.path}` } }, limit: 1, depth: 0, draft: true });
    pageIds.set(p.path, docs[0]?.id ?? (await upsert(payload, 'pages', `page:${p.path}`, { title: p.title, path: p.path, meta: p.meta, layout: p.layout, blocks: [] }, true)));
  }

  /** JSON block → Payload block data (the inverse of lib/cms-map.ts). */
  async function convert(value: unknown, key: string): Promise<unknown> {
    if (Array.isArray(value)) {
      if (value.every((v) => typeof v === 'string')) return value.map((text) => ({ text }));
      return Promise.all(value.map((v) => convert(v, key)));
    }
    if (!value || typeof value !== 'object') {
      if (typeof value !== 'string') return value;
      if (key === 'ctaBand') return idOf('ctaBand', value);
      if (key === 'course' || key === 'coursePrice') return idOf('course', value);
      if (key === 'courses') return idOf('course', value);
      if (key === 'document') return idOf('legal', value);
      return value;
    }
    const o = value as Obj;
    if (typeof o.src === 'string' && typeof o.alt === 'string') return media(o as Img);
    if (key === 'rolling') return { ...o, text: richSegments(o.text as { text: string; href?: string }[]), inquiry: o.inquiry };
    if (key === 'switcher') {
      return { label: o.label, pages: (o.pages as { path: string; label?: string }[]).map((p) => ({ page: pageIds.get(p.path), label: p.label })) };
    }
    const out: Obj = {};
    for (const [k, v] of Object.entries(o)) out[k] = k === 'courses' ? (v as string[]).map((c) => idOf('course', c)) : await convert(v, k);
    return out;
  }

  for (const p of pages) {
    await upsert(payload, 'pages', `page:${p.path}`, { ...p, blocks: await convert(p.blocks, 'blocks') }, true);
  }
  log('pages', pages.length);

  // redirects: the previous (WordPress) site's addresses → the new pages, so search results and
  // old links keep working. Paths of the live site, from its sitemap (October 2026).
  const page = (path: string) => ({ type: 'reference', reference: { relationTo: 'pages', value: pageIds.get(path) } });
  const production = (old: string) => ({ type: 'reference', reference: { relationTo: 'productions', value: idOf('production', old) } });
  const url = (href: string) => ({ type: 'custom', url: href });
  const redirects: [string, Obj][] = [
    ['/rolunk-2', page('/rolunk')],
    ['/kepzeseink-2', page('/kezdo-kurzus')],
    ['/kapcsolat-2', page('/kapcsolat')],
    ['/repertoar-2', page('/repertoar')],
    ['/kozelgo-eloadasok-2', page('/kozelgo-eloadasok')],
    ['/ceges-csapatepito', page('/csapatepito')],
    ['/nyitott-muhely', page('/nyitott-alkalmak')],
    ['/workshop-tabor', url('/nyitott-alkalmak#workshopok')],
    ['/szinhazi-mozgas-workshop-szigethy-norbival-08-13-16', url('/nyitott-alkalmak#workshopok')],
    ['/uj-fooldal', page('/')],
    ['/fejlesztes-alatt', page('/')],
    ['/molnar-ferenc-az-ordog', production('az-ordog')],
    ['/agatha-christie-egerfogo', production('az-egerfogo')],
    ['/boldogsag-es-en', production('a-boldogsag-es-en')],
    ['/csalad-ellen-nincs-orvossag', production('csalad-ellen-nincs-orvossag')],
    ['/events', page('/kozelgo-eloadasok')],
    ['/event/molnar-ferenc-az-ordog-4', production('az-ordog')],
    ['/event/832-hallgatoi-eloadas-nyilvanos-foproba', page('/kozelgo-eloadasok')],
    ['/event/a-premier-hallgatoi-eloadas-nyilvanos-foproba', page('/kozelgo-eloadasok')],
    ['/event/federico-garcia-lorca-bernarda-alba-haza-hallgatoi-eloadas-2', page('/kozelgo-eloadasok')],
    ['/events/kategoria/ordog', production('az-ordog')],
    ['/events/kategoria/agatha-christie-egerfogo', production('az-egerfogo')],
    ['/events/kategoria/ray-cooney-csalad-ellen-nincs-orvossag', production('csalad-ellen-nincs-orvossag')],
    ['/events/kategoria/other', page('/kozelgo-eloadasok')],
  ];
  await each(
    'redirect',
    'redirects',
    redirects.map(([from, to]) => ({ id: from, from, to })),
    ({ from, to }) => ({ from, to, type: '301' }),
  );

  // globals
  const settings = await json<Obj & { contact: Obj; productionPage: Obj; social: Obj }>('site-settings.json');
  await payload.updateGlobal({
    slug: 'siteSettings',
    context: ctx,
    data: {
      ...settings,
      contact: { ...settings.contact, primaryPerson: idOf('contactPerson', settings.contact.primaryPersonId as string) },
      productionPage: { ctaBand: idOf('ctaBand', settings.productionPage.ctaBand as string) },
    } as never,
  });
  await payload.updateGlobal({ slug: 'ui', context: ctx, data: (await json<Obj>('ui.json')) as never });
  payload.logger.info('seeded globals');

  const { totalDocs } = await payload.count({ collection: 'users' });
  if (totalDocs === 0) {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await payload.create({
        collection: 'users',
        data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, lastName: 'Adminisztrátor', firstName: 'Morpheus', roles: ['admin'], _verified: true },
        disableVerificationEmail: true,
      });
      payload.logger.info(`created admin ${process.env.ADMIN_EMAIL}`);
    } else payload.logger.warn('no users yet: set ADMIN_EMAIL and ADMIN_PASSWORD, or create the first user at /admin');
  }
}

await seed();
process.exit(0);
