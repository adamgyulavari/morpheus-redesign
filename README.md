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

```
app/                     routes — one folder per page, server components
  kozelgo-eloadasok/     all upcoming shows by month, with ticket/registration and details popup
  kepzesek/              course overview (side-by-side comparison) — where the "Képzések" nav item lands
  kezdo-kurzus/, szakmai-kurzus/  both render components/CoursePageView.tsx (shared course template)
  layout.tsx             <html lang="hu">, fonts (next/font), header + footer
  globals.css            Tailwind v4 @theme (colours, fonts) + component classes (.btn, .link …)
  icon.svg               favicon (Next serves it automatically)
components/              shared UI; files starting with 'use client' are the interactive ones
content/                 JSON content — one file per collection, pages/ for one-off page texts
lib/
  types.ts               content types, modelled like CMS collections
  data.ts                THE data layer — the only module that reads content/
  dates.ts, format.ts    Budapest-time dates, Hungarian number/phone formatting
  quote-request.ts       team-building quote "submit" (mailto today, Server Action later)
public/images/           photos and posters
```

### Server vs client components

Everything renders on the server by default (no JS shipped for it). Only these are client
components, because they need browser state or events:

| component | why |
|---|---|
| `MobileMenu`, `NavLink` | open/close state; current URL for `aria-current` ("Képzések" is current on both course pages via `match` in site settings) |
| `ReviewSlider`, `Dialog` | scroll position, resize, popup |
| `RepertoireFilter`, `ProductionDetails`, `PosterFit` | filter state, "Bővebben" popup, measuring card heights |
| `VideoEmbed` | loads the YouTube player on click |
| `SessionStatus` | re-checks the Nyitott Műhely booking deadline against the visitor's clock |
| `QuoteRequestForm` | validation + submit |

Client components receive plain data as props; they never import `lib/data.ts`.

## Data layer

`content/` holds one JSON file per collection:

| file | collection | used on |
|---|---|---|
| `productions.json` | Production (title, genre, byline, description, credits, cast, poster) | /repertoar, homepage via shows |
| `shows.json` | Show → `productionId`, `venueId`, date, time, `ticketUrl` or `registrationUrl`, optional `label` and audience `info` | /kozelgo-eloadasok, homepage rows + hero card, /repertoar banner/badges/next-show |
| `venues.json` | Venue | shows |
| `reviews.json` | Review | homepage + /kezdo-kurzus (same slider) |
| `courses.json` | Course with its own `starts[]` (or `nextIntake` month for rolling enrolment) and `prices[]` | homepage cards, /kepzesek, /kezdo-kurzus, /szakmai-kurzus |
| `open-workshop-sessions.json` | one record per Saturday session | /nyitott-alkalmak |
| `workshops.json` | Workshop / camp (dates, daily hours, leader, signup form, images); upcoming ones are featured, finished ones move to "Korábbi workshopok" | /nyitott-alkalmak |
| `team-building-programmes.json` | TeamBuildingProgramme | /csapatepito |
| `contact-people.json` | ContactPerson | /kapcsolat, homepage contact card |
| `instructors.json` | Instructor (empty for now) | homepage avatar stack |
| `site-settings.json` | nav, footer, contact, social, external URLs, video, map | everywhere |
| `pages/*.json` | one-off texts per page + `<title>`/description | each page |

Text conventions: `*…*` marks the emphasised (italic, coloured) part of a heading; `\n` inside a
paragraph is a line break. Dates are Budapest calendar dates (`YYYY-MM-DD`).

`lib/data.ts` exposes async functions — `getProductions(group?)`, `getUpcomingShows(limit?)`,
`getNextShowByProduction()`, `getReviews()`, `getCourse(id)`, `getCourses()`,
`getOpenWorkshopSessions(limit?)`, `getTeamBuildingProgrammes()`, `getContactPeople()`,
`getInstructors()`, `getPageContent(page)`, `getSiteSettings()`. They do the joins
(show → production + venue) and the date filtering (only items from today on, Budapest time).

### Plugging in a CMS (Payload / Sanity)

1. Model the collections after `lib/types.ts` (Production, Show with a relation to Production and
   Venue, Course with nested starts/prices, …) and a global/singleton per page in `pages/`.
2. Re-implement the functions in `lib/data.ts` against the CMS client, keeping the same signatures
   and return types. Nothing else imports content, so pages and components don't change.
3. Images: return `ImageRef` objects (`src`, `alt`, `width`, `height`) and add the CMS image host to
   `images.remotePatterns` in `next.config.ts`.
4. Freshness: keep the daily `revalidate`, and add a webhook route that calls `revalidatePath()`
   when an editor publishes, so changes appear immediately.
5. The quote form: turn `submitQuoteRequest` in `lib/quote-request.ts` into a Server Action that
   stores/e-mails the request.

## Caching & dates

Pages are prerendered at build time (static). Pages with dated content (`/`, `/kozelgo-eloadasok`, `/kepzesek`, `/kezdo-kurzus`,
`/szakmai-kurzus`, `/nyitott-alkalmak`, `/repertoar`) export `revalidate = 86400`: Next.js regenerates them in the
background at most once a day (Incremental Static Regeneration), so past shows, course starts and
sessions drop off without a redeploy. This uses the classic route-segment caching model of Next 16
(Cache Components is not enabled). The Nyitott Műhely booking status additionally re-checks its
deadline in the browser, because "closed after Thursday midnight" can't wait for the daily rebuild.

When there's nothing upcoming, sections show an empty state instead ("Hamarosan…") — wording lives
in `content/pages/*.json`.

## Content still to provide

- New course start dates (the three September dates are past, so /kezdo-kurzus shows "Hamarosan…")
- Review portraits and instructor photos (placeholders until then)
- A new Szakmai kurzus intake month (`nextIntake` in `content/courses.json`; September 2026 has passed)
