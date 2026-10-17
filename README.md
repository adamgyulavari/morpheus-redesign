# Morpheus Színműhely — website

Next.js (App Router) + Tailwind CSS v4, with **Payload CMS** (Postgres) built into the same app:
editors work at `/admin`, the public pages read the content through `lib/data.ts`.

## Local development

Requirements: Node 24, Docker (for Postgres).

```bash
npm install
cp .env.example .env          # then set PAYLOAD_SECRET (openssl rand -hex 32)
npm run db:up                 # Postgres on localhost:5433 (docker-compose.dev.yml)
npm run migrate               # create the tables
npm run seed                  # import the original content + images, create the admin user
npm run dev                   # http://localhost:3000, admin at http://localhost:3000/admin
```

| script | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js. The build needs **no database** (nothing is rendered at build time). |
| `npm run migrate` | apply pending migrations (`payload/migrations/`) |
| `npm run migrate:create -- <name>` | generate a migration after changing collections/blocks |
| `npm run migrate:snapshot` | rebuild the schema snapshot from the config — after merging branches that both added migrations |
| `npm run seed` | import `content/` + `public/images`, `public/video` into Payload; safe to re-run (updates, no duplicates) |
| `npm run generate:types` | regenerate `payload-types.ts` after a schema change |
| `npm run generate:importmap` | regenerate the admin import map after adding an admin component |
| `npm run typecheck` | |
| `npm run lint` / `format` | Biome: check / fix lint and formatting (CI runs `biome ci` before deploying) |

**Schema changes always go through migrations**, locally too (`push: false`): edit `payload/`, run
`npm run migrate:create -- <name>`, review the file, `npm run migrate`, `npm run generate:types`,
commit the migration. Production applies it on container start.

Next to the newest migration there is one generated `.json`: the schema snapshot `migrate:create`
diffs against (running migrations never reads it). Only the newest is kept — older ones are deleted
after each `migrate:create` — and git shows it as a binary file, so reviews show just the `.ts`.
After merging two branches that each added a migration, run `npm run migrate:snapshot` once, or the
next `migrate:create` would repeat one side's changes.

Uploads go to `./media` locally and to Leafcloud Object Storage in production (when `S3_BUCKET` is
set). Deployment, environment variables and backups: see **[DEPLOY.md](DEPLOY.md)**.

The approved static design lives in `archive/static-site/` (open the HTML files directly — images
load from `public/images/`). It is the visual source of truth; `archive/logos/` holds earlier logo
versions. The current logo source is `logo-source/logo-almost-final.svg`.

## Structure

Every content page is data: a document in the **Pages** collection with its route,
`<title>`/description, frame (`site` = header + footer, `minimal` = standalone column) and an
ordered list of typed **blocks**. One route renders them all; editors build and rearrange pages in
the admin without code changes.

```
app/
  (frontend)/            the public site (own root layout)
    [[...slug]]/page.tsx   THE page route: looks the path up in the Pages collection, renders its blocks
    repertoar/[slug]/      production detail template (driven by the production record, not blocks)
    next/preview, next/exit-preview   admin preview → Next.js draft mode
    next/revalidate        re-renders date-dependent pages (called by the hourly job)
    layout.tsx, globals.css, icon.svg
    not-found.tsx          the 404 page (texts in the UI dictionary → "404 oldal")
  (payload)/             Payload admin (/admin) and REST API (/api) — generated, except custom.scss
                           (the admin's Morpheus look: teal palette, gold buttons, site fonts)
payload.config.ts        Payload: database, storage, i18n (hu), collections, globals, jobs
payload/
  collections/           Pages, CtaBands, LegalPages, Productions, Shows, Venues, Courses, …, CourseGroups, Media, Users, LoginTokens
  blocks/                one Payload block per page block type (same slugs as lib/types.ts)
  globals.ts             Site settings, UI dictionary
  fields.ts, access.ts   shared field builders (Hungarian labels/hints) and access rules
  revalidate.ts          afterChange/afterDelete hooks → revalidatePath for the affected pages
  migrations/            database migrations (committed; run on container start)
payload-types.ts         generated types of the Payload documents
instrumentation.ts       initialises Payload at server start (runs migrations, starts jobs)
components/
  blocks/                one component per block type + the registry (index.tsx → RenderBlocks)
  layouts/               SiteLayout (header/main/footer), MinimalLayout (/bio)
  …                      shared UI; files starting with 'use client' are the interactive ones
lib/
  types.ts               content model: collections, globals, Page + the Block union
  data.ts                THE data layer — Payload Local API queries, the only module that reads content
  cms-map.ts             Payload documents → lib/types.ts shapes (ids, images, dates, rich text)
  dates.ts, format.ts    Budapest-time dates, Hungarian number/phone formatting
  quote-request.ts       team-building quote "submit" (mailto today, Server Action later)
scripts/seed.ts          one-off import of the original content (content/, public/images, public/video)
content/                 the original JSON/Markdown content — import source for the seed only
```

### Pages and blocks

A page, as `lib/data.ts` returns it (`Page` in `lib/types.ts`), looks like:

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
  one component in `components/blocks/`, registered in `components/blocks/index.tsx`, and one Payload
  block config in `payload/blocks/index.ts`. Adding a block = a type + a component + a registry entry +
  a block config (+ a migration).
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
- **References instead of copies**: CTA bands live once in their collection and blocks reference them; the course switcher (`pageHero.switcher`) references pages by path and shows their titles;
  a fact can take its value from a course's prices (`{ "label": "Díj", "coursePrice": "kezdo" }`).
- **Conditional content** is computed, not written: e.g. the "Workshop" hero button has
  `"showIf": "upcomingWorkshops"`; empty states appear when a collection has nothing upcoming.

### UI dictionary

Component text that isn't page content — button labels ("Jegyek", "Bővebben"), empty states, form
labels, aria labels — lives in one editable dictionary, the **UI dictionary** global in the admin
(*Felületi szövegek*, typed as `UiStrings`). Server components read it with `getUi()`; client components with `useUi()` (provided once in
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

All content lives in Payload (Postgres). In the admin (Hungarian, grouped in the sidebar):

| admin group | collections / globals | used by |
|---|---|---|
| Oldalak | **Pages** (path, title, meta, layout, blocks), **CTA bands** (reusable, referenced by blocks), **Legal documents** (rich text) | the page route, `ctaBand` / `legalDocument` blocks |
| Előadások | **Productions** (repertoire; `detailPage` → own page at /repertoar/[slug]/), **Shows** (→ production, venue; date, time, ticket/registration link), **Venues** | repertoire, show lists, banners, detail pages |
| Képzések és programok | **Courses** (with start groups, `nextIntake` month for rolling enrolment, prices), **Open workshop sessions**, **Workshops** (upcoming featured, past under "Korábbi workshopok"), **Team-building programmes** | course, workshop and programme blocks |
| Emberek | **Instructors** (`order`), **Reviews**, **Contact people** | people blocks, /bio |
| Tartalom | **Media** (images and videos, alt text required, focal point, generated sizes) | everywhere |
| Kurzusok | **Course groups** (`courseGroups`: a concrete group with dates, students, instructors, info for students; optional link to its catalogue course) | /fiokom |
| Beállítások | **Users** (roles `admin` / `staff` / `student`), **Site settings** (global), **UI dictionary** (global) | header, footer, every component |

Pages, productions and legal documents have **drafts and versions**; pages and productions have
**live preview** (the eye icon in the admin). Visitors and students only ever see published documents.
Staff can edit all content and course groups; only admins give roles, change other admins' accounts,
delete users and delete legal documents. All access rules are the helpers in `payload/access.ts`.

Text conventions: `*…*` marks the emphasised (italic, coloured) part of a heading; a line break inside
a paragraph is kept. Dates are Budapest calendar days.

`lib/data.ts` exposes async functions — `getPages()`, `getPage(path)`, `getUi()`, `getCtaBand(id)`,
`getSiteSettings()`, `getProductions(group?)`, `getUpcomingShows(limit?)`, `getNextShowByProduction()`,
`getCourse(id)` (with its groups open for sign-up), `getOpenWorkshopSessions(limit?)` (live `workshop` sessions), `getUpcomingWorkshops()`, `getPastWorkshops(limit?)`,
`getLegalPage(slug)`, … They query Payload's Local API, filter dated items to today onward (Budapest
time, in the query where possible) and return the types from `lib/types.ts`; every Payload → type
conversion is in `lib/cms-map.ts` (ids as strings, relationships as ids, uploads as `ImageRef`s of
the right generated size, rich text back to paragraphs/segments). Pages and components never see
Payload documents.

The quote form (`lib/quote-request.ts`) still opens the visitor's mail client; turning it into a
Server Action that stores/e-mails the request is a later step.

## Accounts

One auth layer: Payload's `users` collection. A user has one or more **roles**: `admin` and `staff`
work in `/admin`; `student`s log in on the public site only (`/admin` refuses them). Registration
(public) always makes a student; the first account ever created is an admin.

| route | |
|---|---|
| `/belepes` | password login, or "Belépési link küldése" (`payload/magic-link.ts`): the e-mail has a link and a 6-digit code; after sending, this page asks for the code (for reading the e-mail on another device) |
| `/belepes/link` | the link's confirm page: opening it doesn't log in, its "Belépés" button (a POST) does — so mail scanners that open links can't use it up. Link and code: 15 minutes, once, only hashes stored, 5 wrong codes invalidate both; a success starts a normal Payload session (`payload/session.ts`) |
| `/regisztracio` | sign-up (honeypot, privacy checkbox) → verification e-mail |
| `/email-megerosites`, `/elfelejtett-jelszo`, `/jelszo-visszaallitas` | verification and password reset (links in the e-mails point here, not to /admin) |
| `/fiokom` | own data, own course groups ("Kurzusaim"), logout; staff also get a link to /admin |

- The forms are Server Actions (`lib/account-actions.ts`) on the Payload Local API; the session is
  the admin's HTTP-only `payload-token` cookie. `lib/auth.ts` has `getCurrentUser()` / `requireUser()`.
- Account pages are dynamic and never cached; user data never goes through `lib/data.ts`. The cached
  public pages stay the same for everyone: the header's "Belépés" / "Fiókom" is decided in the
  browser from a hint cookie (`morpheus-signed-in`, no secret in it) set at login.
- Verification is required; 5 failed logins lock the account for 10 minutes.
- `payload/students.ts` → `isActiveStudent(payload, user)`: in a course group whose end date hasn't
  passed (for the later student area / room booking).
- E-mail: SMTP (`SMTP_*`, `EMAIL_FROM*`, see `.env.example`) with one Hungarian layout
  (`payload/email.ts`). Without `SMTP_HOST` e-mails are printed to the console; locally, Mailpit
  from `docker-compose.dev.yml` catches them at http://localhost:8025.

## Room calendar and student area

Replaces the room-planning sheet. **Sessions** (`sessions`: course meetings, rehearsals, exams,
shows) say *what* and *when*; **room bookings** (`roomBookings`) say *where*. A session belongs to a
course group or a production and has one place: a booking it owns, an external place, or none yet
("Helyszín nélkül"). Bookings without a session: student practice, rentals, other.

- **Clash guarantee in the database:** `room_occupancy` (one row per room of each confirmed
  booking, written in the booking's transaction) with `EXCLUDE USING gist (room_id WITH =, period
  WITH &&)` — overlapping bookings of a room are impossible, even for simultaneous requests
  (`lib/rooms/occupancy.ts`). Placing a session somewhere taken is refused; if only its time changes
  into a clash, it keeps the time and becomes unplaced.
- **Staff:** `/admin/teremnaptar` (FullCalendar, all rooms in one week view; drag to create, move,
  place unplaced sessions; "Hónap feltöltése" from the groups' weekly schedules, with a tickable
  preview; idempotent). Admins can override clashing student practice (it is cancelled, the student
  is told why).
- **Students:** `/fiokom` (courses, upcoming sessions, groupmates' practice, links),
  `/fiokom/terem` (book practice — rules in `lib/rooms/rules.ts`, settings in
  *Teremnaptár → Teremfoglalási szabályok*), `/fiokom/adatok`. Only active students (a group whose
  end date hasn't passed); room data is never readable by students through the API.
- **E-mails** (`lib/rooms/notify.ts`): practice confirmed (.ics) / changed / cancelled; session
  cancelled, moved or placed elsewhere — one per student per save, not for fill month, not for
  changes more than 30 days ahead.
- Times are stored in UTC; rules and display use Budapest time (`lib/rooms/time.ts`, DST-safe).
  `npm test` runs the rule, generator and .ics tests (Vitest).

## Edit buttons for staff

Logged-in staff get a **Szerkesztés** button (bottom left) on the live site: this page (or
production) in the admin, the site settings and the UI texts. **Blokkok mutatása** outlines the
block under the pointer with a **Blokk szerkesztése** button, which opens the page in the admin at
that block. Links open the admin in a new tab.

- The cached pages stay the same for everyone: they carry hidden markers (`data-cms-doc`, and
  `data-cms-block` before each block, `components/blocks/index.tsx`), and
  `components/edit/EditMode.tsx` decides in the browser, from the hint cookie
  (`morpheus-signed-in=staff`), whether to load the overlay (`EditOverlay.tsx`, a separate chunk
  visitors never download). The admin checks the real permissions. Not shown in live preview.
- `payload/components/BlockFocus.tsx` (a UI field on Pages) handles `?blokk=<block id>`. It relies on
  Payload's DOM ids for block rows (`blocks-row-<n>`): check it after a Payload upgrade.
- The role is read at login: someone who becomes staff sees the buttons after logging in again.

## SEO and redirects

- **Meta data**: pages and productions have an **SEO** tab (Payload SEO plugin): browser title,
  description, sharing image and a Google preview, with *Automatikus generálás* buttons
  (`payload/seo.ts`). Left empty, the site falls back to "<name> — Morpheus Színműhely", the
  hero lead / the story's first sentence, and (productions) the full poster. `lib/seo.ts` builds the
  `<head>`: description, canonical URL, Open Graph, `robots: max-image-preview:large` (as on the
  previous site). The seed fills the SEO fields with the texts the site used so far.
- **Redirects** (*Oldalak → Átirányítások*, Payload redirects plugin, `payload/redirects.ts`): old
  addresses → current pages or productions. The seed adds the previous WordPress site's URLs
  (`/rolunk-2/`, `/kepzeseink-2/`, `/molnar-ferenc-az-ordog/`, `/event/…`, …) as permanent
  redirects. They are only looked up for paths that have no page (`lib/not-found.ts`).
- `/sitemap.xml` (all pages and production pages) and `/robots.txt` are generated per request.
- The public address comes from `NEXT_PUBLIC_SERVER_URL`, read at runtime through `lib/env.ts`
  (Next.js would otherwise inline it at build time, when it isn't set).

## Caching & dates

Nothing is rendered at build time — the Docker build has no database. Both page routes have
`generateStaticParams() { return [] }` and `revalidate = 86400`: a page is rendered on its first
request, then served from the cache (ISR) until something invalidates it:

- **Saving in the admin** — `afterChange`/`afterDelete` hooks (`payload/revalidate.ts`) call
  `revalidatePath` for the pages showing that content. Which pages that is comes from the data:
  each collection is shown by certain block types, and every page containing those blocks is
  revalidated (e.g. a show change → `/`, `/kozelgo-eloadasok`, `/repertoar`, `/bio` and the production
  pages). Site settings, UI texts and media revalidate everything. Drafts/autosaves don't.
- **Every hour** — the `revalidateDates` Payload job (scheduled in `payload.config.ts`, run by
  Payload's job runner inside the server) re-renders the date-dependent pages, so past shows,
  course starts and sessions disappear by the next morning without an edit.
- **Daily** `revalidate` as a safety net.

The Nyitott Műhely booking status additionally re-checks its deadline in the browser, because
"closed after Thursday midnight" can't wait for a re-render. When there's nothing upcoming, sections
show an empty state ("Hamarosan…") — the wording is in the UI dictionary.

## Content still to provide

- New course start dates (the three September dates are past, so /kezdo-kurzus shows "Hamarosan…")
- Review portraits and instructor photos (placeholders until then)
- A new Szakmai kurzus intake month (Kurzusok → Szakmai kurzus → Induló csoportok; September 2026 has passed)
