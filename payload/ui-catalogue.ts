/**
 * The catalogue of the UI texts (Beállítások → Felületi szövegek): which texts the website has,
 * grouped, with each one's label in the admin. Only the keys and labels — the wording, per
 * language, is in the database (the `uiTexts` collection, payload/ui-texts.ts).
 *
 * The texts' syntax follows ICU MessageFormat, so they can be translated later: `{name}` is filled
 * in by the site. Headings mark the highlighted part with *asterisks*, as the page content does.
 * No server code here: the admin's form imports it.
 */

/** group → [label, { key: label }]; `{ long: label }`: a textarea. */
export type UiSpec = { readonly [key: string]: string | { readonly long: string } | readonly [string, UiSpec] };

const SITE = {
  common: [
    'Általános',
    {
      close: 'Bezárás',
      readMore: 'Tovább olvasom',
      more: 'Bővebben',
      signup: 'Jelentkezem gomb',
      mainNav: 'Főmenü (felolvasott név)',
      openMenu: 'Menü megnyitása (felolvasott)',
      closeMenu: 'Menü bezárása (felolvasott)',
      sliderPage: 'Csúszka oldala — {n} = szám',
      slideshow: 'Diavetítés (felolvasott)',
      playVideo: 'Videó lejátszása — {title} = cím',
      facebook: 'Facebook ikon (felolvasott)',
      instagram: 'Instagram ikon (felolvasott)',
      toc: 'Tartalom (felirat)',
      tocLabel: 'Tartalomjegyzék (felolvasott)',
      links: 'Linkek (felolvasott)',
    },
  ],
  shows: [
    'Előadások',
    {
      ticket: 'Jegyek gomb',
      registration: 'Regisztráció gomb',
      about: 'Az előadásról',
      info: 'Tudnivalók',
      nextShow: 'Következő előadás',
      onStage: 'Műsoron címke',
      upcomingCount: 'Előadások száma — {count} = szám',
      empty: 'Nincs közelgő előadás',
    },
  ],
  production: [
    'Előadás aloldal',
    {
      backLink: 'Vissza a repertoárhoz',
      upcomingLink: 'Közelgő előadások link',
      about: 'Az előadásról cím',
      highlights: 'Pontok címe',
      quotes: 'Nézői vélemények címe',
      video: 'Videó címe',
      gallery: 'Galéria címe',
      galleryLabel: 'Galéria (felolvasott) — {title} = cím',
      dates: 'Időpontok címe',
      noDates: 'Nincs időpont',
      ctaDates: 'Időpontok gomb',
      ctaBook: 'Foglalás gomb',
      ctaConvinced: 'Meggyőztetek gomb',
      invite: 'Meghívó videó címe',
    },
  ],
  repertoire: [
    'Repertoár szűrő',
    { filter: 'Szűrés (felolvasott)', all: 'Mind', company: 'Társulati', students: 'Hallgatói' },
  ],
  reviews: [
    'Vélemények',
    { previous: 'Előző (felolvasott)', next: 'Következő (felolvasott)', photoPlaceholder: 'Fotó helye — {name} = név' },
  ],
  gallery: [
    'Galéria',
    {
      previous: 'Előző képek',
      next: 'Következő képek',
      previousImage: 'Előző kép',
      nextImage: 'Következő kép',
      zoom: 'Nagyítás — {alt} = kép leírása',
    },
  ],
  course: [
    'Kurzusok',
    {
      rhythm: 'Ritmus',
      length: 'Hossz',
      admission: 'Felvétel',
      price: 'Díj',
      start: 'Indulás',
      startRolling: 'Folyamatos jelentkezés',
      startSoon: 'Hamarosan',
      details: 'Részletek',
      nextIntake: 'Következő indulás',
      startsEmpty: 'Nincs induló csoport',
      startsEmptyLink: ['Link üres állapotban', { label: 'Felirat', href: 'Cím (link)' }],
    },
  ],
  workshops: [
    'Workshopok',
    {
      date: 'Időpont',
      time: 'Napi időbeosztás',
      leader: 'Kurzusvezető',
      leaderHeading: 'A kurzusvezetőről',
      empty: 'Nincs workshop',
      followUs: 'Kövess minket',
    },
  ],
  sessions: [
    'Nyitott Műhely',
    {
      book: 'Jelentkezem gomb',
      closed: 'Lezárult',
      needed: 'Még kell jelentkező — {count} = szám',
      confirmed: 'Biztosan indul',
      full: 'Megtelt',
      left: 'Szabad helyek — {count} = szám',
      empty: 'Nincs időpont',
    },
  ],
  teamBuilding: ['Csapatépítő', { duration: 'Időkeret', venue: 'Helyszín' }],
  quoteForm: [
    'Árajánlat űrlap',
    {
      title: 'Cím',
      required: 'Kötelező mezők',
      fields: [
        'Mezők',
        {
          company: 'Cég',
          lastName: 'Vezetéknév',
          firstName: 'Keresztnév',
          email: 'E-mail',
          phone: 'Telefon',
          message: 'Üzenet',
        },
      ],
      messagePlaceholder: 'Üzenet mintaszöveg',
      error: 'Hibaüzenet',
      submit: 'Küldés gomb',
      note: 'Megjegyzés a gomb alatt',
      subject: 'E-mail tárgya — {company} = cég',
      mail: ['Az e-mail címkéi', { company: 'Cég', contact: 'Kapcsolattartó', email: 'E-mail', phone: 'Telefon' }],
    },
  ],
  contact: ['Kapcsolat', { person: 'Kapcsolattartó', directions: 'Útvonaltervezés' }],
  notFound: [
    '404 oldal',
    {
      title: 'Böngésző címsor',
      eyebrow: 'Felcím',
      heading: 'Cím — *csillagok közé* írt rész kiemelve',
      text: 'Szöveg',
      primary: ['Fő gomb', { label: 'Felirat', href: 'Cím (link)' }],
      secondary: ['Másodlagos gomb', { label: 'Felirat', href: 'Cím (link)' }],
    },
  ],
} as const satisfies UiSpec;

/** The admin's tabs. */
export const UI_TABS = [{ label: 'Weboldal', spec: SITE }] as const satisfies readonly {
  label: string;
  spec: UiSpec;
}[];

type Strings<S> = { -readonly [K in keyof S]: S[K] extends readonly [string, infer G] ? Strings<G> : string };

/** The texts of one language, complete. */
export type UiStrings = Strings<typeof SITE>;

/** Every text: its path ("common.close"), label and whether it is long. */
export type UiText = { path: string[]; label: string; long: boolean };
const leaves = (spec: UiSpec, path: string[] = []): UiText[] =>
  Object.entries(spec).flatMap(([key, v]): UiText[] =>
    typeof v === 'string'
      ? [{ path: [...path, key], label: v, long: false }]
      : 'long' in v
        ? [{ path: [...path, key], label: v.long, long: true }]
        : leaves(v[1], [...path, key]),
  );
export const UI_TEXTS: UiText[] = UI_TABS.flatMap((t) => leaves(t.spec));

type Tree = { [key: string]: string | Tree | undefined };
export const textAt = (tree: unknown, path: string[]): string | undefined => {
  const v = path.reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Tree)[k] : undefined), tree);
  return typeof v === 'string' ? v : undefined;
};
const setAt = (tree: Tree, path: string[], value: string) => {
  let o = tree;
  for (const k of path.slice(0, -1)) {
    o[k] ??= {};
    o = o[k] as Tree;
  }
  o[path.at(-1) as string] = value;
};

/**
 * The catalogue's texts from `stored` (one language's JSON), anything else dropped: blank or missing
 * ones from `fallback`, then the path itself ("common.close" shows on the page, not a crash).
 */
export function uiStrings(stored: unknown, fallback?: unknown): UiStrings {
  const tree: Tree = {};
  for (const { path } of UI_TEXTS)
    setAt(tree, path, textAt(stored, path)?.trim() || textAt(fallback, path)?.trim() || path.join('.'));
  return tree as unknown as UiStrings;
}

/** The texts a language has (blank ones left out) — what is saved. */
export function storedTexts(texts: unknown): Tree {
  const tree: Tree = {};
  for (const { path } of UI_TEXTS) {
    const v = textAt(texts, path)?.trim();
    if (v) setAt(tree, path, v);
  }
  return tree;
}
