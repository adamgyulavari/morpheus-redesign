/**
 * Content types, modelled like future CMS collections (Payload / Sanity), not like page sections.
 * Items that appear on several pages live once in a collection and are referenced by id.
 *
 * Conventions
 * - Dates are ISO calendar dates ("2026-10-03"), times "HH:mm", both in Europe/Budapest.
 * - `Emphasised` strings mark the highlighted part of a heading with *asterisks*.
 * - A `Paragraph` may contain "\n" for line breaks inside it (short-line stanzas).
 * - `href` is either a site route ("/kapcsolat#…", "#anchor") or an absolute URL.
 */

export type ImageRef = { src: string; alt: string; width: number; height: number };
export type Paragraph = string;
export type Emphasised = string;
export type Link = { label: string; href: string };
/** Nav item; `match` lists extra routes on which it counts as the current page. */
export type NavItem = Link & { match?: string[] };
export type Fact = { label: string; value: string; href?: string };

// ── Productions & shows ─────────────────────────────────────────────────────

export type ProductionGroup = 'company' | 'students';

/** One line of the cast. `names` has more than one entry for alternating (double) casts. */
export type CastEntry = { role?: string; roleNote?: string; names: string[] };
export type Credit = { label: string; name: string };

export type Production = {
  id: string;
  slug: string;
  group: ProductionGroup;
  title: string;
  genre?: string;
  /** Shown next to the genre and under the title in show rows — the author, or e.g. "Hallgatói előadás". */
  byline: string;
  summary: string;
  description: Paragraph[];
  credits: Credit[];
  castLabel: string;
  cast: CastEntry[];
  note?: string;
  poster: ImageRef;
};

export type Venue = { id: string; name: string; shortName: string };

export type Show = {
  id: string;
  productionId: string;
  date: string;
  time: string;
  venueId: string;
  /** e.g. "Nyilvános főpróba" */
  label?: string;
  ticketUrl?: string;
  /** Free entry with registration (instead of tickets). */
  registrationUrl?: string;
  /** Practical notes for the audience, verbatim lines. */
  info?: string[];
};

/** A show joined with what it references — the shape pages work with. */
export type ShowWithRelations = Show & { production: Production; venue: Venue };

// ── People ──────────────────────────────────────────────────────────────────

export type Review = {
  id: string;
  name: string;
  label: string;
  quote: string;
  fullText: Paragraph[];
  photo?: ImageRef;
};

export type Instructor = { id: string; name: string; role?: string; bio?: Paragraph[]; photo?: ImageRef };

export type ContactPerson = { id: string; name: string; role: string; phone: string; photo?: ImageRef };

// ── Courses & events ────────────────────────────────────────────────────────

export type CourseStart = { id: string; date: string; startTime: string; endTime: string };

export type PriceOption = {
  id: string;
  label: string;
  /** HUF */
  amount: number;
  /** Billing period for recurring fees, e.g. "hó" → "45 000 Ft / hó". */
  per?: string;
  note?: string;
  highlighted?: boolean;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  /** Route of the course page, or the old site's URL until the page is rebuilt. */
  url: string;
  signupUrl: string;
  card: { badge: string; text: string; facts: Fact[]; ctaLabel: string };
  starts: CourseStart[];
  /** Shown in the course comparison on /kepzesek, e.g. "felvételi meghallgatással". */
  admission: string;
  /** Courses with rolling enrolment announce a month instead of dated groups, e.g. "2026-09". */
  nextIntake?: string;
  prices: PriceOption[];
};

export type OpenWorkshopSession = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  bookingUrl: string;
  /** Booking closes at the end of this day (Budapest time). */
  bookingDeadline: string;
};

export type Workshop = {
  id: string;
  /** "Workshop" | "Tábor" — shown as the eyebrow. */
  kind: string;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  /** Daily hours, e.g. 10:00–17:00. */
  startTime: string;
  endTime: string;
  intro?: string;
  summary: string;
  leader?: { name: string; bio: Paragraph[] };
  closing?: string;
  signupUrl: string;
  image: ImageRef;
  gallery: ImageRef[];
};

export type TeamBuildingProgramme = {
  id: string;
  name: string;
  duration: string;
  venue: string;
  description: Paragraph[];
};

// ── Site & pages ────────────────────────────────────────────────────────────

export type SiteSettings = {
  name: string;
  tagline: string;
  copyright: string;
  nav: NavItem[];
  headerCta: Link;
  footerColumns: { title: string; links: Link[] }[];
  privacy: Link;
  contact: { email: string; address: string; primaryPersonId: string };
  social: { facebook: string };
  urls: { signup: string; upcomingShows: string; instructors: string; workshopCamp: string };
  video: { youtubeId: string; title: string };
  map: { embedUrl: string; directionsUrl: string; title: string };
};

export type PageMeta = { title: string; description: string };
type Section = { eyebrow: string; heading: Emphasised };
type CtaBand = Section & { text: string; primary: Link; secondary: Link };
type Hero = { heading: string; lead: string };

export type OfferingCard =
  | { courseId: string }
  | { badge: string; title: string; text: string; facts: Fact[]; cta: Link };

export type HomePage = {
  meta: PageMeta;
  hero: {
    keywords: string[];
    heading: Emphasised;
    lead: string;
    primaryCta: Link;
    secondaryCta: Link;
    imageLarge: ImageRef;
    imageSmall: ImageRef;
    nextShowLabel: string;
  };
  questions: Section & { items: { title: string; text: string }[]; closing: Emphasised; cta: Link };
  offerings: Section & { instructorsLink: Link; cards: OfferingCard[] };
  mood: Section & { text: string; facebookLink: Link };
  reviews: Section & { intro: string };
  shows: Section & {
    allLink: Link;
    upcomingLink: Link;
    ticketLabel: string;
    registrationLabel: string;
    aboutLabel: string;
    infoLabel: string;
    empty: string;
  };
  contact: Section & { cta: Link; personLabel: string };
  bottomImage: ImageRef;
};

export type AboutPage = {
  meta: PageMeta;
  hero: Hero & { primaryCta: Link; secondaryCta: Link; image: ImageRef };
  goal: Section & { text: string };
  name: Section & { text: string };
  mission: Section & { quote: string; paragraphs: Paragraph[]; image: ImageRef };
  next: Section & { cards: { eyebrow: string; title: string; href: string; text: string }[] };
  cta: CtaBand;
};

export type CoursePage = {
  meta: PageMeta;
  courseId: string;
  hero: Hero & { facts: Fact[]; primaryCtaLabel: string; secondaryCta: Link; image: ImageRef };
  starts: Section & {
    intro?: string;
    ctaLabel: string;
    /** Shown when there are no dated groups and no rolling enrolment. */
    empty: { text: string; link: Link };
    /** Rolling enrolment (no dated groups): "[…]" in `text` becomes a link to `inquiry`. */
    rolling?: { nextIntakeLabel: string; text: string; note?: string; inquiry: Link };
  };
  /** Either numbered points or a single paragraph. */
  benefits: Section & { items?: string[]; text?: string };
  curriculum: Section & {
    items: string[];
    bonus?: { eyebrow: string; heading: string; text: string };
    image: ImageRef;
  };
  why: { eyebrow: string; heading?: string; quote?: string; quoteSource?: string; text: string }[];
  /** Either path steps or plain paragraphs (+ optional photo). */
  after: Section & { steps?: { kicker: string; title: string; text: string }[]; paragraphs?: string[]; image?: ImageRef };
  reviews: Section & { intro: string };
  prices: Section & { intro?: string; ctaLabel: string };
  cta: CtaBand;
};

export type CoursesOverviewPage = {
  meta: PageMeta;
  hero: Hero & { image: ImageRef };
  compare: Section & {
    labels: { rhythm: string; length: string; admission: string; price: string; start: string };
    startRolling: string;
    startSoon: string;
    detailsLabel: string;
    signupLabel: string;
  };
  path: CoursePage['after'];
  cta: CtaBand;
};

export type OpenWorkshopPage = {
  meta: PageMeta;
  hero: Hero & { primaryCta: Link; workshopCta: Link; secondaryCta: Link; image: ImageRef };
  workshops: {
    eyebrow: string;
    dateLabel: string;
    timeLabel: string;
    leaderLabel: string;
    signupLabel: string;
    moreLabel: string;
    leaderHeading: string;
    pastEyebrow: string;
    pastHeading: string;
    empty: string;
    emptyLink: Link;
  };
  openWorkshop: Section & { lead: string; facts: Fact[] };
  forYou: Section & { closing: string; items: string[] };
  how: Section & { steps: { title: string; text: string }[] };
  sessions: Section & {
    intro: string;
    title: string;
    bookLabel: string;
    closedLabel: string;
    /** "{deadline}" is replaced with the formatted deadline date. */
    openText: string;
    closedText: string;
    empty: string;
  };
  cta: CtaBand;
};

export type RepertoirePage = {
  meta: PageMeta;
  hero: Hero & { image: ImageRef };
  /** Banner pointing to /kozelgo-eloadasok; "{count}" is the number of upcoming shows. */
  upcoming: { eyebrow: string; text: string; link: Link };
  filter: { label: string; all: string; company: string; students: string };
  groups: Record<ProductionGroup, Section & { intro: string }>;
  labels: { onStage: string; nextShow: string; more: string };
  cta: CtaBand;
};

export type UpcomingShowsPage = {
  meta: PageMeta;
  hero: Hero & { image: ImageRef };
  labels: { ticket: string; registration: string; about: string; info: string };
  empty: string;
  repertoireLink: Link;
  cta: CtaBand;
};

export type TeamBuildingPage = {
  meta: PageMeta;
  hero: Hero & { primaryCta: Link; secondaryCta: Link; image: ImageRef };
  programmes: Section & { durationLabel: string; venueLabel: string };
  tailored: Section & { text: string; goals: string[]; image: ImageRef };
  form: QuoteFormContent;
};

export type QuoteFormContent = {
  title: string;
  required: string;
  fields: { company: string; lastName: string; firstName: string; email: string; phone: string; message: string };
  messagePlaceholder: string;
  error: string;
  submit: string;
  note: string;
  recipient: string;
  /** "{company}" is replaced with the company name. */
  subject: string;
};

export type ContactPage = {
  meta: PageMeta;
  hero: Hero & { image: ImageRef };
  email: { eyebrow: string; heading: string };
  location: Section & { addressLines: string[]; text: string; directionsLabel: string };
  social: { heading: string; label: string };
};

export type PageContentMap = {
  home: HomePage;
  rolunk: AboutPage;
  kepzesek: CoursesOverviewPage;
  'kezdo-kurzus': CoursePage;
  'szakmai-kurzus': CoursePage;
  'nyitott-alkalmak': OpenWorkshopPage;
  repertoar: RepertoirePage;
  'kozelgo-eloadasok': UpcomingShowsPage;
  csapatepito: TeamBuildingPage;
  kapcsolat: ContactPage;
};
export type PageKey = keyof PageContentMap;
