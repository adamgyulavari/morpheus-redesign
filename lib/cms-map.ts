/**
 * Payload documents → the content types in lib/types.ts. Every conversion lives here, so pages and
 * components keep working with the same shapes they had when content was static JSON:
 * - ids become strings, relationships become the referenced id (or path / slug),
 * - uploads become `ImageRef`s pointing at the right generated size,
 * - dates (stored as timestamps) become Budapest calendar dates "YYYY-MM-DD",
 * - empty optional values (Payload's `null`, `[]`, empty groups) are left out.
 */
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

import type {
  Block,
  ContactPerson,
  Course,
  CourseStart,
  CtaBand,
  ImageRef,
  Instructor,
  Link,
  OpenWorkshopSession,
  Page,
  Production,
  Review,
  Segment,
  Show,
  SiteSettings,
  TeamBuildingProgramme,
  Venue,
  Workshop,
} from '@/lib/types';
import type * as P from '@/payload-types';
import type { CourseSignupState } from './applications/rules';
import type { OpenWorkshop } from './applications/server';
import { todayInBudapest } from './dates';
import { formatHuf } from './format';
import { clockOf, dayOf, weekdayOf } from './rooms/time';

type Size = keyof NonNullable<P.Media['sizes']>;
type Rel<T> = number | T | null | undefined;

// ── primitives ──────────────────────────────────────────────────────────────

export const idOf = (rel: Rel<{ id: number }>): string => String(typeof rel === 'object' && rel ? rel.id : rel);
const doc = <T extends object>(rel: Rel<T>): T | undefined => (typeof rel === 'object' && rel ? rel : undefined);
const opt = <T>(v: T | null | undefined): T | undefined => (v === null || v === '' ? undefined : v);
const optArray = <T>(v: T[] | null | undefined): T[] | undefined => (v?.length ? v : undefined);

/** A stored day (a timestamp around noon) → its Budapest calendar date. */
export const day = (iso: string): string => todayInBudapest(new Date(iso));

/**
 * Media URLs are served by Payload at /api/media/file/… (from local disk or S3). Payload prefixes
 * them with the server URL; they are kept site-relative so next/image treats them as local files.
 */
const relative = (url: string) => url.replace(/^https?:\/\/[^/]+(?=\/api\/media\/)/, '');

export function mediaUrl(rel: Rel<P.Media>): string | undefined {
  const url = doc(rel)?.url;
  return url ? relative(url) : undefined;
}

/** An upload → ImageRef, using the given generated size when it exists (small originals have none). */
export function img(rel: Rel<P.Media>, size: Size): ImageRef | undefined {
  const m = doc(rel);
  if (!m?.url) return undefined;
  const s = m.sizes?.[size];
  // the generated size, if it was made (small originals have none)
  const use =
    s?.url && s.width && s.height
      ? { url: s.url, width: s.width, height: s.height }
      : { url: m.url, width: m.width, height: m.height };
  return { src: relative(use.url), alt: m.alt, width: use.width ?? 0, height: use.height ?? 0 };
}

const imgReq = (rel: Rel<P.Media>, size: Size): ImageRef => {
  const ref = img(rel, size);
  if (!ref) throw new Error('Missing required image');
  return ref;
};

const texts = (items: { text: string }[] | null | undefined): string[] => (items ?? []).map((i) => i.text);
const link = (l: { label?: string | null; href?: string | null } | null | undefined): Link => ({
  label: l?.label ?? '',
  href: l?.href ?? '',
});

// ── rich text ───────────────────────────────────────────────────────────────

type LexNode = {
  type: string;
  text?: string;
  children?: LexNode[];
  fields?: { url?: string; linkType?: string; doc?: { value?: unknown } };
};

const plain = (nodes: LexNode[] = []): string =>
  nodes.map((n) => (n.type === 'linebreak' ? '\n' : n.type === 'tab' ? '\t' : (n.text ?? plain(n.children)))).join('');

/** Rich text with plain paragraphs → one string per paragraph (line breaks kept as "\n"). */
export function paragraphsFromRichText(state: SerializedEditorState | null | undefined): string[] {
  const root = state?.root as unknown as LexNode | undefined;
  return (root?.children ?? []).map((p) => plain(p.children)).filter((t) => t.trim() !== '');
}

const linkHref = (n: LexNode): string | undefined => {
  if (n.fields?.linkType === 'internal') {
    const target = n.fields.doc?.value as { path?: string } | undefined;
    return target?.path;
  }
  return n.fields?.url;
};

/** Rich text with links → text segments (`{ text, href? }`), paragraphs joined by a space. */
export function segmentsFromRichText(state: SerializedEditorState | null | undefined): Segment[] {
  const root = state?.root as unknown as LexNode | undefined;
  const out: Segment[] = [];
  (root?.children ?? []).forEach((p, i) => {
    if (i > 0) out.push({ text: ' ' });
    for (const n of p.children ?? []) {
      if (n.type === 'link' || n.type === 'autolink') out.push({ text: plain(n.children), href: linkHref(n) });
      else out.push({ text: n.type === 'linebreak' ? '\n' : (n.text ?? plain(n.children)) });
    }
  });
  return out;
}

// ── collections ─────────────────────────────────────────────────────────────

export const venue = (v: P.Venue): Venue => ({ id: String(v.id), name: v.name, shortName: v.shortName });

function inviteVideo(v: P.Production['inviteVideo']): Production['inviteVideo'] {
  const src = mediaUrl(v?.video);
  return src && v?.poster ? { src, title: v.title ?? '', poster: imgReq(v.poster, 'card') } : undefined;
}

export function production(p: P.Production): Production {
  return {
    id: String(p.id),
    slug: p.slug,
    group: p.group,
    title: p.title,
    genre: opt(p.genre),
    byline: p.byline,
    summary: p.summary,
    tagline: opt(p.tagline),
    descriptionHeading: opt(p.descriptionHeading),
    heroImage: img(p.heroImage, 'band'),
    heroVideo: mediaUrl(p.heroVideo),
    detailPage: p.detailPage ?? false,
    longDescription: paragraphsFromRichText(p.longDescription as SerializedEditorState),
    highlights: optArray(p.highlights?.map((h) => ({ title: h.title, text: h.text }))),
    audienceQuotes: optArray(p.audienceQuotes?.map((q) => ({ text: q.text, author: opt(q.author) }))),
    videoUrl: opt(p.videoUrl),
    inviteVideo: inviteVideo(p.inviteVideo),
    gallery: optArray((p.gallery ?? []).map((g) => img(g, 'gallery')).filter((g): g is ImageRef => Boolean(g))),
    credits: (p.credits ?? []).map((c) => ({ label: c.label, name: c.name })),
    castLabel: p.castLabel,
    cast: (p.cast ?? []).map((c) => ({ role: opt(c.role), roleNote: opt(c.roleNote), names: c.names ?? [] })),
    note: opt(p.note),
    poster: imgReq(p.poster, 'poster'),
    meta: { title: opt(p.meta?.title), description: opt(p.meta?.description), image: img(p.meta?.image, 'og') },
  };
}

export const show = (s: P.Show): Show => ({
  id: String(s.id),
  productionId: idOf(s.production),
  date: day(s.date),
  time: s.time,
  venueId: idOf(s.venue),
  label: opt(s.label),
  ticketUrl: opt(s.ticketUrl),
  registrationUrl: opt(s.registrationUrl),
  info: optArray(texts(s.info)),
});

export const review = (r: P.Review): Review => ({
  id: String(r.id),
  name: r.name,
  label: r.label,
  quote: r.quote,
  fullText: texts(r.fullText),
  photo: img(r.photo, 'card'),
});

export const instructor = (i: P.Instructor): Instructor => ({
  id: String(i.id),
  name: i.name,
  role: i.role,
  bio: texts(i.bio),
  photo: imgReq(i.photo, 'card'),
  order: i.order,
});

export const contactPerson = (c: P.ContactPerson): ContactPerson => ({
  id: String(c.id),
  name: c.name,
  role: c.role,
  phone: c.phone,
  photo: img(c.photo, 'card'),
});

export const course = (c: P.Course, starts: CourseStart[]): Course => ({
  id: String(c.id),
  slug: c.slug,
  title: c.title,
  url: c.url,
  signupMode: c.signupMode ?? 'external',
  openWithoutGroup: Boolean(c.openWithoutGroup),
  signupUrl: c.signupUrl,
  rhythm: c.rhythm,
  length: c.length,
  card: { badge: c.card.badge, text: c.card.text, ctaLabel: c.card.ctaLabel },
  starts,
  admission: c.admission,
  nextIntake: c.nextIntake ? day(c.nextIntake).slice(0, 7) : undefined,
  prices: c.prices.map((p) => ({
    id: p.id ?? p.label,
    label: p.label,
    amount: p.amount,
    per: opt(p.per),
    note: opt(p.note),
    highlighted: p.highlighted ?? undefined,
  })),
});

/** A course group open for sign-up, with its state (lib/applications/rules courseSignupState). */
export const courseStart = (g: P.CourseGroup, s: CourseSignupState, onlinePayments = false): CourseStart => {
  const first = dayOf(new Date(g.startDate));
  const schedule = g.defaultSchedule ?? [];
  const entry = schedule.find((e) => Number(e.weekday) === weekdayOf(first)) ?? schedule[0];
  const beginner = (g.signup?.kind ?? (g.type === 'szakmai' ? 'professional' : 'beginner')) === 'beginner';
  const options = beginner
    ? (g.signup?.options ?? []).map((o) => ({
        id: o.id ?? o.label,
        label: o.label,
        amount: o.amount,
        installments: Math.max(1, Math.round(o.installments ?? 1)),
        note: opt(o.note),
        highlighted: o.highlighted ?? undefined,
      }))
    : [];
  const lowest = options.length ? Math.min(...options.map((o) => o.amount)) : null;
  return {
    id: String(g.id),
    groupId: g.id,
    code: g.code ?? '',
    title: g.title,
    date: first,
    startTime: entry?.startTime ?? undefined,
    endTime: entry?.endTime ?? undefined,
    signup: {
      state: s.state,
      left: s.state === 'open' ? s.left : null,
      opensAt: s.state === 'notYet' ? s.opensAt.toISOString() : undefined,
      // kezdő: from the payment options; otherwise the group's own price (label)
      price:
        lowest != null
          ? `${formatHuf(lowest)}${options.length > 1 ? '-tól' : ''}`
          : g.signup?.priceLabel || (g.signup?.price != null ? formatHuf(g.signup.price) : undefined),
    },
    payOnline: onlinePayments && beginner && Boolean(g.signup?.payOnline) && options.length > 0,
    options,
  };
};

export const openWorkshopSession = (w: OpenWorkshop): OpenWorkshopSession => ({
  id: w.id,
  code: w.code,
  title: w.title,
  description: opt(w.description),
  date: dayOf(new Date(w.start)),
  startTime: clockOf(new Date(w.start)),
  endTime: clockOf(new Date(w.end)),
  place: w.place,
  price: w.price,
  state: w.state,
});

export const workshop = (w: P.Workshop): Workshop => ({
  id: String(w.id),
  kind: w.kind,
  title: w.title,
  subtitle: opt(w.subtitle),
  startDate: day(w.startDate),
  endDate: day(w.endDate),
  startTime: w.startTime,
  endTime: w.endTime,
  intro: opt(w.intro),
  summary: w.summary,
  leader: w.leader?.name ? { name: w.leader.name, bio: texts(w.leader.bio) } : undefined,
  closing: opt(w.closing),
  signupUrl: w.signupUrl,
  image: imgReq(w.image, 'gallery'),
  gallery: (w.gallery ?? []).map((g) => img(g, 'gallery')).filter((g): g is ImageRef => Boolean(g)),
});

export const teamBuildingProgramme = (t: P.TeamBuildingProgramme): TeamBuildingProgramme => ({
  id: String(t.id),
  name: t.name,
  duration: t.duration,
  venue: t.venue,
  description: texts(t.description),
});

export const ctaBand = (c: P.CtaBand): CtaBand => ({
  id: String(c.id),
  eyebrow: c.eyebrow,
  heading: c.heading,
  text: c.text,
  primary: link(c.primary),
  secondary: link(c.secondary),
});

// ── globals ─────────────────────────────────────────────────────────────────

export const siteSettings = (s: P.SiteSetting): SiteSettings => ({
  name: s.name,
  tagline: s.tagline,
  copyright: s.copyright,
  nav: s.nav.map((n) => ({ ...link(n), match: optArray(n.match) })),
  headerCta: link(s.headerCta),
  footerColumns: s.footerColumns.map((c) => ({
    title: c.title,
    links: c.links.map(link),
    social: c.social || undefined,
  })),
  privacy: link(s.privacy),
  contact: { email: s.contact.email, address: s.contact.address, primaryPersonId: idOf(s.contact.primaryPerson) },
  social: { facebook: s.social.facebook, instagram: s.social.instagram, tixa: opt(s.social.tixa) },
  urls: { upcomingShows: s.urls.upcomingShows, repertoire: s.urls.repertoire },
  map: { embedUrl: s.map.embedUrl, directionsUrl: s.map.directionsUrl, title: s.map.title },
  productionPage: { ctaBand: idOf(s.productionPage.ctaBand) },
});

// ── pages & blocks ──────────────────────────────────────────────────────────

/** Which generated size each block image uses (default: gallery). */
const BLOCK_IMAGE_SIZE: Partial<Record<string, Size>> = { imageLarge: 'card', imageSmall: 'card' };
const FULL_WIDTH_BLOCKS = new Set(['fullImage']);

const isMedia = (v: object): v is P.Media => 'mimeType' in v && 'filename' in v && 'alt' in v;
const isLexical = (v: object): v is SerializedEditorState => 'root' in v;

/**
 * Generic block conversion: drops Payload bookkeeping (`id`, `blockName`) and empty values,
 * turns `[{ text }]` lists into string arrays, uploads into ImageRefs and relationships into ids.
 */
function clean(value: unknown, key: string, blockType: string): unknown {
  if (value === null || value === undefined || value === '') return undefined;
  if (Array.isArray(value)) {
    const items = value.map((v) => clean(v, key, blockType)).filter((v) => v !== undefined);
    const isTextList = value.every(
      (v) => v && typeof v === 'object' && Object.keys(v).every((k) => k === 'id' || k === 'text'),
    );
    return isTextList && value.length ? items.map((i) => (i as { text: string }).text) : items;
  }
  if (typeof value !== 'object') return value;
  if (isMedia(value))
    return img(value, FULL_WIDTH_BLOCKS.has(blockType) ? 'band' : (BLOCK_IMAGE_SIZE[key] ?? 'gallery'));
  if (isLexical(value)) return segmentsFromRichText(value);
  // relationships to other collections
  if ('id' in value && key !== '_') {
    if (key === 'page') return (value as { path?: string }).path;
    if (key === 'document') return (value as { slug?: string }).slug;
    if (['course', 'courses', 'ctaBand', 'coursePrice'].includes(key)) return String((value as { id: number }).id);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === 'id' || k === 'blockName') continue;
    const c = clean(v, k, blockType);
    if (c !== undefined) out[k] = c;
  }
  return Object.keys(out).length ? out : undefined;
}

type RawBlock = NonNullable<P.Page['blocks']>[number];

export function block(raw: RawBlock): Block {
  const b = (clean(raw, '_', raw.blockType) ?? {}) as Record<string, unknown> & { blockType: string };
  b.blockId = opt(raw.id);
  const empty = (k: string) => Array.isArray(b[k]) && (b[k] as unknown[]).length === 0 && delete b[k];
  switch (b.blockType) {
    case 'pageHero': {
      ['facts', 'buttons'].forEach(empty);
      const sw = b.switcher as { label?: string; pages?: unknown[] } | undefined;
      if (!sw?.pages?.length) delete b.switcher;
      else {
        const rawPages =
          (raw as { switcher?: { pages?: { page: Rel<P.Page>; label?: string | null }[] | null } }).switcher?.pages ??
          [];
        sw.pages = rawPages.map((p) => ({ path: doc(p.page)?.path ?? '', label: opt(p.label) }));
      }
      break;
    }
    case 'textSplit':
      empty('facts');
      break;
    case 'benefits':
      empty('items');
      break;
    case 'path':
      ['steps', 'paragraphs'].forEach(empty);
      break;
    case 'curriculum':
      if (!(b.bonus as { heading?: string } | undefined)?.heading) delete b.bonus;
      break;
    case 'upcomingShows':
      b.links ??= [];
      if (!(b.headerLink as Link | undefined)?.href) delete b.headerLink;
      break;
    case 'courseStarts': {
      const r = b.rolling as { text?: Segment[]; inquiry?: Link } | undefined;
      if (!r?.inquiry?.href && !r?.text?.length) delete b.rolling;
      break;
    }
    case 'offerings':
      b.cards = ((b.cards as Record<string, unknown>[] | undefined) ?? []).map((c) =>
        c.course ? { course: c.course } : { facts: [], ...c },
      );
      break;
  }
  return b as unknown as Block;
}

export const page = (p: P.Page): Page => ({
  id: String(p.id),
  path: p.path,
  title: p.title,
  // empty title: the route falls back to "<title> — <site name>"
  meta: { title: p.meta?.title ?? '', description: opt(p.meta?.description), image: img(p.meta?.image, 'og') },
  layout: p.layout,
  blocks: (p.blocks ?? []).map(block),
});
