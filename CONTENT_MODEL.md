# Content model — Morpheus Színműhely

> **Updated after review:** CourseStart and PriceOption are now nested inside a `Course` collection
> (`content/courses.json`: Kezdő kurzus + Szakmai kurzus); open-workshop Saturdays are real records
> (`content/open-workshop-sessions.json`), not generated. `lib/types.ts` is the authoritative model;
> sections 1 and 7 below are the original proposal.

Inventory of the 7 static pages in `archive/static-site/` (the design source of truth) and the proposed
types for the Next.js data layer. Everything here is modelled like future CMS collections: items that
appear on several pages live **once** in a collection and are referenced or queried from each page.

---

## 1. Collections (repeated items)

### Production — `content/productions.json` (8)
Used on: **/repertoar** (all 8 cards), **/** (via Show → poster, title, byline), **/repertoar** next-show box (via Show).

| field | example | notes |
|---|---|---|
| id, slug | `az-ordog` | |
| group | `company` \| `students` | 4 + 4 |
| title | Az ördög | |
| genre | Dráma · Krimikomédia · Dráma két felvonásban … | chip on the card |
| byline | Molnár Ferenc · Cserháti Zsuzsa életművéből · Hallgatói előadás | **replaces the brief's `author`**: shown next to the genre and as the subtitle in show rows. It isn't always an author ("Cserháti Zsuzsa életművéből", "Hallgatói előadás") |
| summary | 1–2 sentence teaser | card text |
| description | paragraphs[] (+ short-line stanzas) | the "Bővebben" popup, full original text |
| credits | `{ label, name }[]` | **replaces `director?`/`translator?`**: the HTML also has "Szövegkönyv és rendezés", "Narráció", "Zongorán kísér" |
| castLabel | Szereposztás · Szereplők · Előadják | heading above the cast |
| cast | `{ role?, roleNote?, names: string[] }[]` | **extends the brief's `{role?, name}`**: double casts ("László G. Attila / Zsámbok Zalán") need `names[]`, Vízkereszt needs `roleNote` ("Illíria uralkodója"). Name-only lists (A Kísérlet, Káprázat) simply omit `role` |
| note? | "A szerző engedélyét a Ray Cooney Plays (UK)…" | small print under the cast (Család ellen) |
| poster | ImageRef | 8 posters |

Derived, not stored: **"Műsoron" badge** = has an upcoming Show; **"Következő előadás" box** = its next Show.

### Show — `content/shows.json` (3)
Used on: **/** "Közelgő előadások" rows + hero "Következő előadás" card, **/repertoar** next-show box per production.

| field | example |
|---|---|
| id | `kaprazat-2026-10-03` |
| productionId | `kaprazat` (reference) |
| date | `2026-10-03` |
| time | `18:00` |
| venueId | `frankel` (reference, see Venue) |
| ticketUrl? | `https://www.tixa.hu/kaprazat-hallgatoi-eloadas-20261003` |

Weekday ("szombat"), month ("okt.") and "Okt. 3., szombat" are formatted from `date` with `Intl` (`hu-HU`), not stored.

### Venue — `content/venues.json` (2) — *new, small*
The same venue is written three ways in the HTML: "1027 Budapest, Frankel Leó út 6." (homepage rows),
"Frankel Leó út 6." (homepage hero card) and "Frankel Leó út 6., Budapest" (repertoire box).

| field | example |
|---|---|
| id | `frankel`, `hanko-gyomro` |
| name | 1027 Budapest, Frankel Leó út 6. · Hankó István Művészeti Központ, Gyömrő |
| shortName | Frankel Leó út 6. · Hankó István Művészeti Központ, Gyömrő |

→ The repertoire box would show `name` ("1027 Budapest, Frankel Leó út 6."), a one-word change from today.

### Review — `content/reviews.json` (8)
Used on: **/** and **/kezdo-kurzus** (identical slider, same 8 notes, same order).

| field | example |
|---|---|
| id | `vellai-tamas` |
| name | Vellai Tamás |
| label | Morpheus-hallgató |
| quote | „Segít kiszakadnom a szürke hétköznapokból…” |
| fullText | paragraphs[] (popup) |
| photo? | ImageRef — none yet; the HTML shows a placeholder avatar |

Note colour, tilt and tape colour cycle by position: presentation, not data.

### CourseStart — `content/course-starts.json` (3)
Used on: **/kezdo-kurzus** "Induló kezdő kurzusok".

| field | example |
|---|---|
| id | `2026-09-16-szerda` |
| date | `2026-09-16` |
| startTime / endTime | `18:00` / `20:00` |

Weekday is derived from `date` (the brief lists a `weekday` field; deriving it means it can't drift from the date).
All 3 current dates are in the past → see empty state in §6.

### PriceOption — `content/price-options.json` (3)
Used on: **/kezdo-kurzus** "Képzési költségek". Also the source for **"140 000 Ft-tól"** (homepage card + course hero facts) = lowest price.

| field | example |
|---|---|
| id | `egyben` |
| label | Egy összegben · Két részletben · Három részletben |
| amount | `140000` (HUF; formatted "140 000 Ft") |
| note | kedvezményesen · 2 × 80 000 Ft · 3 × 60 000 Ft |
| highlighted | `true` for "Egy összegben" (dark card) |

### TeamBuildingProgramme — `content/team-building-programmes.json` (4)
Used on: **/csapatepito**.

| field | example |
|---|---|
| id | `civil-beugro` |
| name | Civil Beugró |
| duration | 90–120 perc |
| venue | irodai környezet (mozgatható asztalokkal és székekkel), étterem |
| description | paragraphs[] (Kincskereső: 3, Vacsoraszínház: 2) |

### ContactPerson — `content/contact-people.json` (2)
Used on: **/kapcsolat** (both), **/** contact card (Fruzsina, labelled "Kapcsolattartó" there instead of "Elnök").

| field | example |
|---|---|
| id | `nagy-fruzsina-lilla` |
| name | Nagy Fruzsina Lilla |
| role | Elnök · Produkciós menedzser |
| phone | `+36304639129` (display "+36 30 463 9129" formatted) |
| photo? | ImageRef (Roland has none → initials avatar "KR") |

### Instructor — `content/instructors.json` (0, empty for now)
No page lists instructors; the homepage "Ismerd meg oktatóinkat" link shows 4 placeholder avatars and goes
to the old site. Type defined (`name, role?, bio?, photo?`) so the avatar stack can use real photos later;
until then the 4 placeholders render as today.

### Open workshop sessions — computed, settings in `content/open-workshop.json`
Used on: **/nyitott-muhely** "Következő alkalmak" (next 6 Saturdays). Not stored as items: generated by
`getOpenWorkshopSessions()` from settings: weekday (Saturday), 14:00–16:00, 5 000 Ft, booking closes at the end
of the Thursday before, `bookingUrl`, how many to show (6).

---

## 2. One-off page texts — `content/pages/*.json` (`PageContent`)

Headings with an emphasised part (`<em>`) use `*…*` in the string, e.g. `"Így látják a *Morpheust.*"`, rendered
by one `RichHeading` helper (maps cleanly to CMS rich text later).

**/ (home)**: hero (3 keywords, heading, lead, 2 CTAs, 2 hero photos); "Neked szól, ha…" (heading + 4 numbered
items + closing line + CTA); "Képzések és alkalmak" (heading, instructors link, **4 offering cards**: badge,
title, text, 2–3 facts, CTA); "Hangulat" (heading, text, Facebook link, YouTube video); reviews heading + intro;
"Színpadon / Közelgő előadások" heading; contact card (heading, CTA, person ref + label, address); bottom photo.

**/rolunk**: hero (heading, lead, 2 CTAs, photo); "A színműhely célja" (heading, text); "A nevünk" (heading,
text); "Küldetésünk" (heading, quote, 2 paragraphs, photo); "Ismerj meg minket / Hol kezdenéd?" (3 link cards);
CTA band (Oktatóink).

**/kezdo-kurzus**: hero (heading, lead, 4 facts, 2 CTAs, photo); starts heading + intro; "Mire jó ez?" (4 numbered
benefits); "Mit fogsz tanulni?" (5 numbered items + "Grátisz + 2 alkalom" box, photo); 2 "why" cards (one with the
Shakespeare quote); "Mi lesz a kezdő kurzus után?" (3 steps); reviews heading; prices heading + intro; CTA band.

**/nyitott-muhely**: hero (heading, lead, 4 facts, 2 CTAs, photo); "Rád is igazak az alábbiak?" (5 checklist
items + "Akkor a legjobb helyen vagy!"); "Ez érdekel, hogyan tudok jelentkezni?" (4 steps); sessions heading + intro;
CTA band.

**/repertoar**: hero (heading, lead, photo); section heading + intro for "Társulati előadások" and "Hallgatóink
saját alkotásai"; filter chip labels; CTA band.

**/csapatepito**: hero (heading, lead, 2 CTAs, photo); programmes heading; "Személyre szabva" (heading, text,
4 goals, photo); quote form texts (title, helper, labels, placeholder, error, button, mail-client note).

**/kapcsolat**: hero (heading, lead); email card (heading, label); location (heading, address, text,
directions link, map); "Kövess minket" band.

**Per page**: `<title>` and meta description (copied 1:1 from the HTML).

### SiteSettings — `content/site-settings.json`
- name, tagline ("Színház · Önismeret · Közösség"), copyright line
- header nav (6 items) + header CTA "Jelentkezem" → `/kezdo-kurzus`
- footer: 4 link columns (Képzések / Nyitott alkalmak / Előadások / Kövess minket) + privacy link
- contact: email, primary phone, address
- social: Facebook
- external URLs used across pages: sign-up form, booking calendar, upcoming-shows page, instructors page,
  advanced course, workshop/camp, privacy policy
- YouTube video (id + title), Google Maps embed + directions URL

---

## 3. Images → `public/images/` (ImageRef: src, alt, width, height)

| file | size | belongs to |
|---|---|---|
| laughing-faces.webp | 1000×563 | home hero (big circle), /rolunk hero |
| on-stage.webp | 274×274 | home hero (small circle) |
| full-width-bottom.webp | 800×450 | home bottom photo, /nyitott-muhely hero |
| meghajlas-szinpadon.webp | 1984×1000 | /repertoar hero |
| nagy-fruzsina-lilla.jpg | 550×550 | ContactPerson Fruzsina (home contact card, /kapcsolat) |
| poster-*.{png,webp,jpg} ×8 | 566×800 … 952×1347 | Production.poster |
| szinhazi-kepzes-2.webp | 1000×563 | /rolunk mission |
| szinhazi-kepzes-4.webp | 1000×1398 | /kezdo-kurzus curriculum |
| szinhazi-kepzes-5.webp | 1000×563 | /kezdo-kurzus hero |
| csapatepito-csoport.webp | 800×460 | /csapatepito hero |
| csapatepito-szinpad.webp | 2048×2560 | /csapatepito "Személyre szabva" |
| szinhazi-kepzes-1.webp | 2048×1152 | **unused** on any page (kept) |
| YouTube thumbnail (remote) | — | home video facade, `i.ytimg.com` (needs `images.remotePatterns`) |

Placeholders still in the HTML (no photo yet): 8 review portraits, 4 instructor avatars.
Logo: `logo-source/logo-almost-final.svg` → `Logo` component. Favicon: `favicon.svg` (see open questions).

---

## 4. Interactive elements

| element | where | becomes |
|---|---|---|
| Mobile menu toggle | all | `MobileMenu` (client) |
| Review slider: scroll-snap, prev/next, dots per page | /, /kezdo-kurzus | `ReviewSlider` (client) |
| "Tovább olvasom" → popup with full review | /, /kezdo-kurzus | `ReviewSlider` + shared `Dialog` (client) |
| Repertoire filter chips with counts (aria-pressed) | /repertoar | `RepertoireFilter` (client) |
| "Bővebben" → popup with full description | /repertoar | `ProductionDetails` (client, shared `Dialog`) |
| Poster column fitting (cards as tall as poster, ≥1280px) | /repertoar | small client effect inside the production list |
| YouTube facade: thumbnail → no-cookie iframe on click | / | `VideoEmbed` (client) |
| Google Maps iframe (lazy) | /kapcsolat | server, `loading="lazy"` |
| Open-workshop session open/closed status | /nyitott-muhely | see §6 |
| Quote request form → prefilled `mailto:` | /csapatepito | `QuoteRequestForm` (client, submit handler isolated for a later Server Action) |
| Anchors `#indulo`, `#hogyan`, `#idopontok`, `#programok`, `#ajanlat` | several | kept |
| CSS-only: pulsing rings + breathing curtains (home logo), curtain button hover, nav underline | all | `globals.css`, no JS |

## 5. External links (kept as-is)

- Sign-up: `https://morpheus-szinmuhely.hu/hirek-jelentkezes/` (all "Jelentkezem" on /kezdo-kurzus)
- Booking calendar: `https://morpheus-szinmuhely.hu/nyitott-muhely/` ("Foglalok")
- Tickets: 3 × `https://www.tixa.hu/…` (Show.ticketUrl)
- Old-site pages not rebuilt: `/szakmai-kurzus/`, `/oktatok/`, `/workshop-tabor/`, `/kozelgo-eloadasok-2/`, `/adatkezelesi-tajekoztato/`
- Facebook: `https://www.facebook.com/profile.php?id=61553500586744`
- YouTube `SR8yBRM7ZzE` (watch link + `youtube-nocookie.com` embed)
- Google Maps embed + `https://maps.google.com/?q=1027+Budapest,+Frankel+Leó+út+6.`
- `tel:+36304639129`, `tel:+36209560560`, `mailto:morpheus.szinmuhely@gmail.com`

---

## 6. Behaviour decisions

- **Past items drop off** (`date < today`, Budapest time): shows, course starts. Pages revalidate daily.
- **No upcoming course starts** → the starts section shows an empty state instead of cards:
  *"Hamarosan új csoportokat indítunk. Kérdésed van? Írj vagy hívj bátran!"* with a link to /kapcsolat. ← wording to confirm
- **No upcoming shows** → home "Közelgő előadások" shows the same style of empty line
  (*"Hamarosan új előadásokkal jelentkezünk."*), the hero "Következő előadás" card and the repertoire
  next-show boxes / "Műsoron" badges simply don't render. ← wording to confirm
- **Open-workshop status**: the Saturday list is server-rendered, but "Foglalás … csütörtök éjfélig" vs
  "Lezárult" flips at Thursday midnight. With daily revalidation it could be wrong for up to a day, so the status
  is computed client-side from the date (tiny client component), with the server value as the initial render.

---

## 7. Proposed types (`lib/types.ts`)

```ts
export type ImageRef = { src: string; alt: string; width: number; height: number };
export type Paragraph = string;              // "\n" inside = line break (stanzas)
export type Emphasised = string;             // "*…*" marks the emphasised part of a heading
export type Link = { label: string; href: string };   // href: route ("/kapcsolat#…") or absolute URL

export type ProductionGroup = 'company' | 'students';
export type CastEntry = { role?: string; roleNote?: string; names: string[] };
export type Credit = { label: string; name: string };
export type Production = {
  id: string; slug: string; group: ProductionGroup;
  title: string; genre: string; byline: string;
  summary: string; description: Paragraph[];
  credits: Credit[]; castLabel: string; cast: CastEntry[]; note?: string;
  poster: ImageRef;
};

export type Venue = { id: string; name: string; shortName: string };
export type Show = { id: string; productionId: string; date: string; time: string; venueId: string; ticketUrl?: string };
export type ShowWithRelations = Show & { production: Production; venue: Venue };   // what getUpcomingShows returns

export type Review = { id: string; name: string; label: string; quote: string; fullText: Paragraph[]; photo?: ImageRef };
export type Instructor = { id: string; name: string; role?: string; bio?: Paragraph[]; photo?: ImageRef };
export type CourseStart = { id: string; date: string; startTime: string; endTime: string };
export type PriceOption = { id: string; label: string; amount: number; note: string; highlighted?: boolean };
export type TeamBuildingProgramme = { id: string; name: string; duration: string; venue: string; description: Paragraph[] };
export type ContactPerson = { id: string; name: string; role: string; phone: string; photo?: ImageRef };

export type OpenWorkshopSettings = {
  weekday: number; startTime: string; endTime: string; price: number;
  bookingUrl: string; closesDaysBefore: number;   // 1 = closes when the day before starts (Thursday midnight)
  sessionsToShow: number;
};
export type OpenWorkshopSession = { date: string; bookingDeadline: string; isOpen: boolean };

export type SiteSettings = {
  name: string; tagline: string; copyright: string;
  nav: Link[]; headerCta: Link;
  footerColumns: { title: string; links: Link[] }[]; privacy: Link;
  contact: { email: string; phone: string; address: string; primaryPersonId: string };
  social: { facebook: string };
  urls: { signup: string; booking: string; upcomingShows: string; instructors: string; advancedCourse: string; workshopCamp: string };
  video: { youtubeId: string; title: string };
  map: { embedUrl: string; directionsUrl: string };
};

// One typed shape per page; e.g.
export type PageMeta = { title: string; description: string };
export type HomePage = { meta: PageMeta; hero: {...}; questions: {...}; offerings: {...}; mood: {...}; reviews: {...}; shows: {...}; contact: {...}; bottomImage: ImageRef };
export type PageKey = 'home' | 'rolunk' | 'kezdoKurzus' | 'nyitottMuhely' | 'repertoar' | 'csapatepito' | 'kapcsolat';
// getPageContent<K extends PageKey>(key: K): Promise<PageContentMap[K]>
```

### `lib/data.ts` (the only module that reads `content/`)
`getSiteSettings()`, `getPageContent(key)`, `getProductions(group?)`, `getProduction(id)`,
`getUpcomingShows(limit?)` (today onward, sorted, joined with production + venue),
`getNextShowByProduction()`, `getReviews()`, `getInstructors()`, `getCourseStarts()` (today onward),
`getPriceOptions()`, `getLowestPrice()`, `getTeamBuildingProgrammes()`, `getContactPeople()`,
`getOpenWorkshopSessions()`.

---

## 8. Open questions

1. **Brief deviations**: OK to use `byline` instead of `author`, `credits[]` instead of `director?/translator?`, `cast.names[]` + `roleNote`, a small `Venue` collection, and a derived weekday on `CourseStart`?
2. **Empty-state wording** for no course starts / no shows (§6).
3. **Favicon**: regenerate it from `logo-almost-final.svg` (neck mask + beams) so it matches the new logo, or keep the current one?
4. **Unused image** `szinhazi-kepzes-1.webp`: keep in `public/images/` or move to `archive/`?
