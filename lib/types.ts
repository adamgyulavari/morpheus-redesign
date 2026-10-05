/**
 * Content types, modelled like future CMS collections (Payload / Sanity), not like page sections.
 * Items that appear on several pages live once in a collection and are referenced by id.
 *
 * Pages are not modelled here as fixed shapes: every page is a list of typed blocks (see "Pages &
 * blocks" at the bottom), so editors can build and rearrange pages in the CMS. Component text that
 * isn't page content (button labels, empty states, aria labels…) lives in the `UiStrings` dictionary.
 *
 * Conventions
 * - Dates are ISO calendar dates ("2026-10-03"), times "HH:mm", both in Europe/Budapest.
 * - `Emphasised` strings mark the highlighted part of a heading with *asterisks*.
 * - A `Paragraph` may contain "\n" for line breaks inside it (short-line stanzas).
 * - `href` is either a site route ("/kapcsolat#…", "#anchor") or an absolute URL.
 * - Content never contains placeholders; only UI strings do ("{count} előadás…"), filled in by code.
 */

export type ImageRef = { src: string; alt: string; width: number; height: number };
export type Paragraph = string;
export type Emphasised = string;
export type Link = { label: string; href: string };
/** Nav item; `match` lists extra routes on which it counts as the current page. */
export type NavItem = Link & { match?: string[] };
/** A label/value pair. `coursePrice` takes the value from a course's prices ("140 000 Ft-tól") instead of `value`. */
export type Fact = { label: string; value?: string; href?: string; coursePrice?: string };

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
  /** Detail page: one-line hook under the title, and a heading above the description. */
  tagline?: string;
  descriptionHeading?: string;
  /** Detail page hero background; falls back to the first gallery photo, then the poster. */
  heroImage?: ImageRef;
  /** Muted looping background video for the detail page hero (heroImage is its still frame). */
  heroVideo?: string;
  /** Has its own page at /repertoar/[slug]/; otherwise "Bővebben" opens a popup with longDescription. */
  detailPage?: boolean;
  longDescription: Paragraph[];
  /** The "why come" points. */
  highlights?: { title: string; text: string }[];
  audienceQuotes?: { text: string; author?: string }[];
  videoUrl?: string;
  /** Self-hosted personal invitation (e.g. the director's recommendation), square, with sound. */
  inviteVideo?: { src: string; title: string; poster: ImageRef };
  gallery?: ImageRef[];
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

export type Instructor = { id: string; name: string; role: string; bio: Paragraph[]; photo: ImageRef; order: number };

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
  /** e.g. "heti 1×2 óra" */
  rhythm: string;
  /** e.g. "20 alkalom (+2)" */
  length: string;
  /** Homepage offering card and /kepzesek comparison. */
  card: { badge: string; text: string; ctaLabel: string };
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

// ── Site ────────────────────────────────────────────────────────────────────

export type SiteSettings = {
  name: string;
  tagline: string;
  copyright: string;
  nav: NavItem[];
  headerCta: Link;
  /** `social: true` adds the Facebook/Instagram icons under the column's links. */
  footerColumns: { title: string; links: Link[]; social?: boolean }[];
  privacy: Link;
  contact: { email: string; address: string; primaryPersonId: string };
  social: { facebook: string; instagram: string };
  urls: { upcomingShows: string; repertoire: string };
  map: { embedUrl: string; directionsUrl: string; title: string };
  /** Settings of the production detail template (/repertoar/[slug]). */
  productionPage: { ctaBand: string };
};

/** A reusable call-to-action band (referenced by id from pages). */
export type CtaBand = {
  id: string;
  eyebrow: string;
  heading: Emphasised;
  text: string;
  primary: Link;
  secondary: Link;
};

/**
 * Component text that is not page content: labels, empty states, aria labels, form texts.
 * One editable dictionary (a CMS global); "{name}" placeholders are filled in by the components.
 */
export type UiStrings = {
  common: {
    close: string;
    readMore: string;
    more: string;
    signup: string;
    mainNav: string;
    openMenu: string;
    closeMenu: string;
    /** "{n}. oldal" */
    sliderPage: string;
    slideshow: string;
    /** "{title} lejátszása" */
    playVideo: string;
    facebook: string;
    instagram: string;
    toc: string;
    tocLabel: string;
    links: string;
  };
  shows: {
    ticket: string;
    registration: string;
    about: string;
    info: string;
    nextShow: string;
    onStage: string;
    /** "{count} előadás a következő hetekben" */
    upcomingCount: string;
    empty: string;
  };
  production: {
    backLink: string;
    upcomingLink: string;
    about: string;
    highlights: string;
    quotes: string;
    video: string;
    gallery: string;
    /** lightbox label: "{title} — képek" */
    galleryLabel: string;
    dates: string;
    noDates: string;
    ctaDates: string;
    ctaBook: string;
    ctaConvinced: string;
    invite: string;
  };
  repertoire: { filter: string; all: string; company: string; students: string };
  reviews: { previous: string; next: string; /** "Fotó helye: {name} portréja" */ photoPlaceholder: string };
  gallery: { previous: string; next: string; previousImage: string; nextImage: string; /** "{alt} — nagyítás" */ zoom: string };
  course: {
    rhythm: string;
    length: string;
    admission: string;
    price: string;
    start: string;
    startRolling: string;
    startSoon: string;
    details: string;
    nextIntake: string;
    startsEmpty: string;
    startsEmptyLink: Link;
  };
  workshops: {
    date: string;
    time: string;
    leader: string;
    leaderHeading: string;
    empty: string;
    followUs: string;
  };
  sessions: {
    book: string;
    closed: string;
    /** "Foglalás {deadline}, csütörtök éjfélig" */
    open: string;
    closedText: string;
    empty: string;
  };
  teamBuilding: { duration: string; venue: string };
  quoteForm: {
    title: string;
    required: string;
    fields: { company: string; lastName: string; firstName: string; email: string; phone: string; message: string };
    messagePlaceholder: string;
    error: string;
    submit: string;
    note: string;
    /** "Csapatépítő árajánlatkérés – {company}" */
    subject: string;
    /** Labels inside the generated e-mail. */
    mail: { company: string; contact: string; email: string; phone: string };
  };
  contact: { person: string; directions: string };
};

// ── Pages & blocks ──────────────────────────────────────────────────────────

export type PageMeta = { title: string; description: string };

/**
 * A page: its route, the `<title>`/description, which frame it renders in, and its content as an
 * ordered list of blocks. `site` = header + footer; `minimal` = a narrow standalone column (/bio).
 */
export type Page = {
  /** Route, e.g. "/" or "/rolunk". */
  path: string;
  /** Short name, used where other pages link to this one (e.g. the course switcher). */
  title: string;
  meta: PageMeta;
  layout: 'site' | 'minimal';
  blocks: Block[];
};

/** Vertical space above/below a block: none, xs (24/48px), sm (40/64), md (48/88), lg (64/120). */
export type Space = 'none' | 'xs' | 'sm' | 'md' | 'lg';

/** Fields every block has. `anchor` becomes the section's id (for "#idopontok"-style links). */
type BlockBase = { anchor?: string; spacing?: { top?: Space; bottom?: Space } };

type Section = { eyebrow: string; heading: Emphasised };

/** A text segment; with `href` it is a link. A paragraph is a list of segments. */
export type Segment = { text: string; href?: string };

export type HeroButton = Link & {
  variant?: 'primary' | 'outline';
  /** Only shown when the condition holds, e.g. the "Workshop" button while one is upcoming. */
  showIf?: 'upcomingWorkshops';
};

/** How the hero photo sits next to the text. */
export type HeroImageLayout = {
  /** landscape: sm / md / lg; portrait: a tall card */
  shape?: 'landscape' | 'portrait';
  size?: 'sm' | 'md' | 'lg';
  /** degrees, negative = counter-clockwise; phones use 60% of it */
  tilt?: number;
  /**
   * bottom: the photo sits at the bottom of a 440px area (heroes with long text);
   * top: the photo starts at the top and the area is only as tall as the photo (short heroes);
   * middle: a taller photo centred on the sun
   */
  position?: 'top' | 'middle' | 'bottom';
};

export type OfferingCardData = { badge: string; title: string; text: string; facts: Fact[]; cta: Link };

export type Block = BlockBase &
  (
    // ── heroes
    | {
        blockType: 'homeHero';
        keywords: string[];
        heading: Emphasised;
        lead: string;
        primaryCta: Link;
        secondaryCta: Link;
        imageLarge: ImageRef;
        imageSmall: ImageRef;
        /** Card with the next show (if there is one). */
        nextShow?: boolean;
      }
    | {
        blockType: 'pageHero';
        heading: string;
        lead: string;
        image: ImageRef;
        layout?: HeroImageLayout;
        /** Segmented switch above the title linking sibling pages (by path); labels default to their titles. */
        switcher?: { label: string; pages: { path: string; label?: string }[] };
        facts?: Fact[];
        buttons?: HeroButton[];
        /** The repertoire filter chips (Mind / Társulati / Hallgatói). */
        repertoireFilter?: boolean;
      }
    // ── editorial
    | { blockType: 'ctaBand'; ctaBand: string }
    | { blockType: 'textSplit'; eyebrow: string; heading: Emphasised; size?: 'md' | 'xl'; text: string; facts?: Fact[] }
    | { blockType: 'statement'; eyebrow: string; heading: Emphasised; text: string }
    | { blockType: 'imageText'; eyebrow: string; heading: Emphasised; quote?: string; paragraphs: Paragraph[]; image: ImageRef }
    | (Section & { blockType: 'linkCards'; cards: { eyebrow: string; title: string; href: string; text: string }[] })
    | (Section & { blockType: 'questions'; items: { title: string; text: string }[]; closing: Emphasised; cta: Link })
    | (Section & { blockType: 'benefits'; text?: string; items?: string[] })
    | (Section & { blockType: 'curriculum'; items: string[]; bonus?: { eyebrow: string; heading: string; text: string }; image: ImageRef })
    | { blockType: 'featureCards'; cards: { eyebrow: string; heading?: string; quote?: string; quoteSource?: string; text: string }[] }
    | (Section & {
        blockType: 'path';
        /** Numbered steps, or paragraphs (+ optional photo). */
        steps?: { kicker: string; title: string; text: string }[];
        paragraphs?: Paragraph[];
        image?: ImageRef;
      })
    | (Section & { blockType: 'checklist'; closing: string; items: string[] })
    | (Section & { blockType: 'steps'; steps: { title: string; text: string }[] })
    | (Section & { blockType: 'moodVideo'; text: string; link: Link; video: { youtubeId: string; title: string } })
    | { blockType: 'fullImage'; image: ImageRef }
    | { blockType: 'socialBand'; heading: string; link: Link }
    // ── driven by collections
    | (Section & { blockType: 'offerings'; instructorsLink: Link; cards: ({ course: string } | OfferingCardData)[] })
    | (Section & { blockType: 'reviews'; intro: string })
    | (Section & { blockType: 'instructorRow'; text: string; link: Link })
    | { blockType: 'instructorGrid' }
    | {
        blockType: 'upcomingShows';
        /** list: one list with a heading; byMonth: grouped under month headings. */
        variant: 'list' | 'byMonth';
        eyebrow?: string;
        heading?: string;
        /** Shown beside the heading on desktop and with the links below on phones. */
        headerLink?: Link;
        links: Link[];
      }
    | { blockType: 'nextShowBanner'; link: Link }
    | { blockType: 'repertoire'; groups: (Section & { group: ProductionGroup; intro: string })[] }
    | (Section & { blockType: 'contactCard'; cta: Link })
    | (Section & {
        blockType: 'courseStarts';
        course: string;
        intro?: string;
        /** Rolling enrolment (no dated groups): how to enquire. */
        rolling?: { text: Segment[]; note?: string; inquiry: Link };
      })
    | (Section & { blockType: 'coursePrices'; course: string; intro?: string })
    | (Section & { blockType: 'courseCompare'; courses: string[] })
    | { blockType: 'upcomingWorkshops' }
    | (Section & { blockType: 'pastWorkshops'; limit: number })
    | (Section & { blockType: 'openWorkshopSessions'; intro: string; title: string; limit: number })
    | (Section & { blockType: 'programmes' })
    | (Section & { blockType: 'quoteRequest'; text: string; goals: string[]; image: ImageRef })
    | { blockType: 'contactPeople'; email: { eyebrow: string; heading: string } }
    | (Section & { blockType: 'location'; addressLines: string[]; text: string })
    | { blockType: 'legalDocument'; document: string }
    // ── link-in-bio
    | { blockType: 'bioIntro' }
    | { blockType: 'bioNextShow' }
    | { blockType: 'linkList'; links: Link[] }
    | { blockType: 'socialLinks' }
    | { blockType: 'contactFooter' }
  );

export type BlockType = Block['blockType'];
/** The block with the given `blockType`. */
export type BlockOf<T extends BlockType> = Extract<Block, { blockType: T }>;
