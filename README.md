# Morpheus Színműhely — website

Next.js (App Router) + Tailwind CSS v4. All content comes from static JSON in `content/`, read only
through `lib/data.ts`, so a CMS can replace the JSON later without touching pages or components.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also type-checks)
npm run typecheck
```

The approved static design lives in `archive/static-site/` (open the HTML files directly — images
load from `public/images/`). It is the visual source of truth; `archive/logos/` holds earlier logo
versions. The current logo source is `logo-source/logo-almost-final.svg`.

## Structure

Every content page is data: a record in the **Pages** collection (`content/pages/*.json`) with its
route, `<title>`/description, frame (`site` = header + footer, `minimal` = standalone column) and an
ordered list of typed **blocks**. One route renders them all; editors can build and rearrange pages
without code changes (the model is meant to map 1:1 onto Payload CMS blocks).

```
app/
  [[...slug]]/page.tsx   THE page route: looks the path up in the Pages collection, renders its blocks
  repertoar/[slug]/      production detail template (driven by the production record, not blocks)
  layout.tsx             <html lang="hu">, fonts (next/font), the UI dictionary provider
  globals.css            Tailwind v4 @theme (colours, fonts) + component classes (.btn, .link …)
  icon.svg               favicon
components/
  blocks/                one component per block type + the registry (index.tsx → RenderBlocks)
  layouts/               SiteLayout (header/main/footer), MinimalLayout (/bio)
  …                      shared UI; files starting with 'use client' are the interactive ones
content/                 JSON content — collections, globals, pages/
lib/
  types.ts               content model: collections, globals, Page + the Block union
  data.ts                THE data layer — the only module that reads content/
  dates.ts, format.ts    Budapest-time dates, Hungarian number/phone formatting
  quote-request.ts       team-building quote "submit" (mailto today, Server Action later)
public/images/, video/   photos, posters, production videos
```

### Pages and blocks

A page file looks like:

```json
{
  "path": "/rolunk",
  "title": "Rólunk",
  "meta": { "title": "Rólunk — Morpheus Színműhely", "description": "…" },
  "layout": "site",
  "blocks": [
    { "blockType": "pageHero", "heading": "Rólunk", "lead": "…", "image": { … }, "layout": { "size": "md", "tilt": -2.5, "position": "top" }, "buttons": [ … ] },
    { "blockType": "textSplit", "eyebrow": "A színműhely célja", "heading": "Élmény, kikapcsolódás, *fejlődés.*", "text": "…" },
    { "blockType": "ctaBand", "ctaBand": "probald-ki-egy-szombaton" }
  ]
}
```

- **Block types** are a discriminated union (`Block` in `lib/types.ts`, keyed by `blockType`); each has
  one component in `components/blocks/`, registered in `components/blocks/index.tsx`. Adding a block =
  a type + a component + a registry entry.
- **Every block** may have `anchor` (section id for `#links`) and `spacing: { top, bottom }`
  (`none | xs | sm | md | lg`; default: `lg` above, nothing below; heroes flush; CTA bands `lg` both).
- **Editorial blocks** carry their own text (`textSplit`, `statement`, `imageText`, `linkCards`,
  `questions`, `benefits`, `curriculum`, `featureCards`, `path`, `checklist`, `steps`, `moodVideo`,
  `fullImage`, `socialBand`, heroes).
- **Collection blocks** render data from collections and take only their headings/options
  (`upcomingShows` list/byMonth, `nextShowBanner`, `repertoire`, `offerings`, `reviews`,
  `instructorRow`/`instructorGrid`, `courseStarts`/`coursePrices`/`courseCompare` (by course id),
  `upcomingWorkshops`/`pastWorkshops`, `openWorkshopSessions`, `programmes`, `quoteRequest`,
  `contactCard`/`contactPeople`, `location`, `legalDocument`, and the link-in-bio blocks).
- **References instead of copies**: CTA bands live once in `content/cta-bands.json` and are referenced
  by id; the course switcher (`pageHero.switcher`) references pages by path and shows their titles;
  a fact can take its value from a course's prices (`{ "label": "Díj", "coursePrice": "kezdo" }`).
- **Conditional content** is computed, not written: e.g. the "Workshop" hero button has
  `"showIf": "upcomingWorkshops"`; empty states appear when a collection has nothing upcoming.

### UI dictionary

Component text that isn't page content — button labels ("Jegyek", "Bővebben"), empty states, form
labels, aria labels — lives in one editable dictionary, `content/ui.json` (`UiStrings`; a Payload
global). Server components read it with `getUi()`; client components with `useUi()` (provided once in
the root layout). Only UI strings may contain placeholders (`"{count} előadás a következő hetekben"`);
page content never does.

### Server vs client components

Everything renders on the server by default (no JS shipped for it). Only these are client
components, because they need browser state or events:

| component | why |
|---|---|
| `MobileMenu`, `NavLink` | open/close state; current URL for `aria-current` ("Képzések" is current on both course pages via `match` in site settings) |
| `ReviewSlider`, `Gallery`, `SnapSlider`, `Dialog`, `DetailsDialog` | scroll position, resize, popups, lightbox |
| `RepertoireFilter`, `ProductionDetails`, `PosterFit` | filter state, "Bővebben" popup, measuring card heights |
| `VideoEmbed` | loads the YouTube player on click |
| `SessionStatus` | re-checks the Nyitott Műhely booking deadline against the visitor's clock |
| `QuoteRequestForm` | validation + submit |
| `UiStrings` | provides the UI dictionary to the above |

Client components receive plain data as props; they never import `lib/data.ts`.

## Data layer

`content/` holds one JSON file per collection or global:

| file | what | used by |
|---|---|---|
| `pages/*.json` | **Pages** collection: path, title, meta, layout, blocks | the page route |
| `cta-bands.json` | reusable CTA bands, referenced by id | `ctaBand` blocks, production template |
| `ui.json` | UI dictionary (global) | all components |
| `site-settings.json` | nav, footer columns (`social: true` adds the icons), contact, social, map, URLs, production template settings (global) | header, footer, blocks |
| `productions.json` | Production (title, genre, byline, summary, longDescription, credits, cast, poster; optional tagline, hero image/video, highlights, audienceQuotes, videoUrl, inviteVideo, gallery). `detailPage: true` → own page at /repertoar/[slug]/, otherwise "Bővebben" opens a popup | repertoire, shows, detail pages |
| `shows.json` | Show → `productionId`, `venueId`, date, time, `ticketUrl` or `registrationUrl`, optional `label` and audience `info` | show lists, banners, next-show cards |
| `venues.json` | Venue | shows |
| `reviews.json` | Review | `reviews` block |
| `courses.json` | Course: rhythm, length, admission, card text, `starts[]` (or `nextIntake` month for rolling enrolment), `prices[]` | course blocks, offering cards |
| `open-workshop-sessions.json` | one record per Saturday session | `openWorkshopSessions` |
| `workshops.json` | Workshop / camp; upcoming ones are featured, finished ones move to "Korábbi workshopok" | workshop blocks |
| `team-building-programmes.json` | TeamBuildingProgramme | `programmes` |
| `contact-people.json` | ContactPerson | contact blocks, /bio |
| `instructors.json` | Instructor (name, role, bio, photo, order) | instructor blocks, homepage avatars |
| `legal/*.md` | legal documents, verbatim | `legalDocument` |

Text conventions: `*…*` marks the emphasised (italic, coloured) part of a heading; `\n` inside a
paragraph is a line break; inline links are segments (`[{ "text": "…" }, { "text": "itt", "href": "mailto:…" }]`).
Dates are Budapest calendar dates (`YYYY-MM-DD`).

`lib/data.ts` exposes async functions — `getPages()`, `getPage(path)`, `getUi()`, `getCtaBand(id)`,
`getSiteSettings()`, `getProductions(group?)`, `getUpcomingShows(limit?)`, `getNextShowByProduction()`,
`getCourse(id)`, `getOpenWorkshopSessions(limit?)`, `getUpcomingWorkshops()`, `getPastWorkshops(limit?)`,
… They do the joins (show → production + venue) and the date filtering (only items from today on,
Budapest time).

### Plugging in a CMS (Payload / Sanity)

1. Model the collections after `lib/types.ts` (Production, Show with a relation to Production and
   Venue, Course with nested starts/prices, …), a **Pages** collection whose `blocks` field has one
   Payload block per `Block` variant (same `blockType` slugs and fields), a **CTA bands** collection,
   and globals for site settings and the UI dictionary.
2. Re-implement the functions in `lib/data.ts` against the CMS client, keeping the same signatures
   and return types. Nothing else imports content, so pages and components don't change.
3. Images: return `ImageRef` objects (`src`, `alt`, `width`, `height`) and add the CMS image host to
   `images.remotePatterns` in `next.config.ts`.
4. Freshness: keep the daily `revalidate`, and add a webhook route that calls `revalidatePath()`
   when an editor publishes, so changes appear immediately.
5. The quote form: turn `submitQuoteRequest` in `lib/quote-request.ts` into a Server Action that
   stores/e-mails the request.

## Deploying to GitHub Pages

`.github/workflows/pages.yml` builds a fully static export and publishes it to GitHub Pages on every
push to `main`, on demand (Actions → *Deploy to GitHub Pages* → *Run workflow*), and every night at
00:15 Budapest time. One-time setup: repo **Settings → Pages → Build and deployment → Source:
GitHub Actions**.

The static build is switched on by `GITHUB_PAGES=true` (see `next.config.ts`); locally:
`npm run build:pages` writes it to `out/`. Differences from the server build: no ISR (the nightly
rebuild drops past dates instead), no redirects (the old `/nyitott-muhely` URL simply 404s there),
and images are served unoptimised via `lib/image-loader.ts`, which adds the `/<repo>` base path.
With a custom domain the base path becomes empty automatically.

## Caching & dates

Pages are prerendered at build time (static), and both page routes export `revalidate = 86400`:
Next.js regenerates them in the background at most once a day (Incremental Static Regeneration), so past shows, course starts and
sessions drop off without a redeploy. This uses the classic route-segment caching model of Next 16
(Cache Components is not enabled). The Nyitott Műhely booking status additionally re-checks its
deadline in the browser, because "closed after Thursday midnight" can't wait for the daily rebuild.

When there's nothing upcoming, sections show an empty state instead ("Hamarosan…") — wording lives
in `content/ui.json`.

## Content still to provide

- New course start dates (the three September dates are past, so /kezdo-kurzus shows "Hamarosan…")
- Review portraits and instructor photos (placeholders until then)
- A new Szakmai kurzus intake month (`nextIntake` in `content/courses.json`; September 2026 has passed)
