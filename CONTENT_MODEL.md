# Content model — Morpheus Színműhely

`lib/types.ts` is the authoritative model; this is the overview, written with the planned Payload CMS
admin in mind. Content is Hungarian and copied verbatim from the original site.

Three kinds of content:

1. **Collections**: repeated records that live once and are referenced or queried (productions,
   shows, courses…).
2. **Globals**: one-off settings, i.e. site settings and the UI dictionary.
3. **Pages**: a route plus an ordered list of typed **blocks**. Editorial blocks hold their own text;
   collection blocks hold only headings and options and render records from the collections.

Rules that keep it CMS-friendly:

- **No templating in content.** Values that depend on data are computed by blocks: the lowest course
  price, the number of upcoming shows, booking deadlines.
- **Inline links are segments**, not markup: `[{ "text": "…" }, { "text": "itt", "href": "mailto:…" }]`.
  This maps to rich text later.
- **Only UI strings have placeholders.** Example: `"{count} előadás a következő hetekben"`.
- `*…*` marks the emphasised part of a heading, and `\n` in a paragraph is a line break.
- **Presentation stays in code.** Note colours, card tilts and grid layouts are not content. A few
  layout options are data on purpose:
  - hero photo arrangement (`layout`)
  - block spacing
  - `textSplit` size

---

## Collections

| collection | file | key fields | relations |
|---|---|---|---|
| **Pages** | `pages/*.json` | `path`, `title`, `meta {title, description}`, `layout: site \| minimal`, `blocks[]` | blocks reference CTA bands, courses, pages |
| **CTA bands** | `cta-bands.json` | `id`, eyebrow, heading, text, primary, secondary | referenced by `ctaBand` blocks and by `siteSettings.productionPage.ctaBand` |
| **Productions** | `productions.json` | slug, group (`company`/`students`), title, genre, byline, summary, longDescription[], credits[], castLabel, cast[] (`names[]` for double casts), poster; detail-page extras (tagline, descriptionHeading, heroImage, heroVideo, highlights, audienceQuotes, videoUrl, inviteVideo, gallery), `detailPage` | — |
| **Shows** | `shows.json` | date, time, label?, ticketUrl / registrationUrl, info[] | → production, → venue |
| **Venues** | `venues.json` | name, shortName | — |
| **Courses** | `courses.json` | title, url, signupUrl, rhythm, length, admission, card {badge, text, ctaLabel}, starts[] **or** nextIntake (rolling enrolment), prices[] | — |
| **Open workshop sessions** | `open-workshop-sessions.json` | date, times, price, bookingUrl, bookingDeadline | — |
| **Workshops** | `workshops.json` | kind, title, subtitle, dates, daily hours, intro, summary, leader {name, bio}, closing, signupUrl, image, gallery | — |
| **Team-building programmes** | `team-building-programmes.json` | name, duration, venue, description[] | — |
| **Reviews** | `reviews.json` | name, label, quote, fullText[], photo? | — |
| **Instructors** | `instructors.json` | name, role, bio[], photo, order | — |
| **Contact people** | `contact-people.json` | name, role, phone, photo? | primary person ← site settings |
| **Legal documents** | `legal/*.md` | Markdown, verbatim | ← `legalDocument` block |

Derived, never stored:
- "Műsoron" badges, next-show cards and the upcoming count, which come from shows dated today or later;
- course start lists and the intake month, which are filtered by date;
- whether a workshop is upcoming or past;
- booking open/closed (re-checked in the browser).

## Globals

**Site settings** (`site-settings.json`):
- name, tagline, copyright
- nav (with `match` for extra "current" routes), header CTA
- footer columns (`social: true` adds the icons), privacy link
- contact (e-mail, address, primary person), social URLs, map
- `urls` (upcoming shows, repertoire)
- `productionPage.ctaBand`

**UI dictionary** (`ui.json`, `UiStrings`): component text grouped by area:

| group | what it covers |
|---|---|
| `common` | close, read more, signup, menu/slider/video aria labels, table of contents |
| `shows` | ticket, registration, about, info, next show, on stage, upcoming count, empty state |
| `production` | detail-page section titles and CTA labels |
| `repertoire` | filter chip labels |
| `reviews`, `gallery` | slider labels |
| `course` | comparison labels, next intake, empty state |
| `workshops` | workshop labels and empty state |
| `sessions` | booking labels |
| `teamBuilding` | programme labels |
| `quoteForm` | all quote form texts and the e-mail labels |
| `contact` | contact labels |

## Blocks

Every block has `blockType` and may have:
- `anchor`: the section id, e.g. `idopontok`.
- `spacing: { top?, bottom? }`, one of `none | xs | sm | md | lg`. The default is `lg` above and nothing below. Heroes and the legal document sit flush, and a CTA band is `lg` on both sides.

| block | fields | notes |
|---|---|---|
| `homeHero` | keywords[], heading, lead, primaryCta, secondaryCta, imageLarge, imageSmall, nextShow? | next-show card from shows |
| `pageHero` | heading, lead, image, layout {shape, size, tilt, position}, switcher? {label, pages[{path, label?}]}, facts[]?, buttons[]? {label, href, variant, showIf?}, repertoireFilter? | switcher labels default to the referenced pages' titles; a fact may use `coursePrice` |
| `ctaBand` | ctaBand (id) | reference |
| `textSplit` | eyebrow, heading, size (`md`/`xl`), text, facts[]? | |
| `statement` | eyebrow, heading, text | dark band |
| `imageText` | eyebrow, heading, quote?, paragraphs[], image | |
| `linkCards` | eyebrow, heading, cards[{eyebrow, title, href, text}] | |
| `questions` | eyebrow, heading, items[{title, text}], closing, cta | dark band |
| `benefits` | eyebrow, heading, text?, items[]? | dark band |
| `curriculum` | eyebrow, heading, items[], bonus?, image | |
| `featureCards` | cards[{eyebrow, heading?, quote?, quoteSource?, text}] | |
| `path` | eyebrow, heading, steps[]? or paragraphs[] + image? | |
| `checklist` | eyebrow, heading, closing, items[] | |
| `steps` | eyebrow, heading, steps[{title, text}] | |
| `moodVideo` | eyebrow, heading, text, link, video {youtubeId, title} | |
| `fullImage` | image | |
| `socialBand` | heading, link | |
| `offerings` | eyebrow, heading, instructorsLink, cards[] (`{course}` reference or inline card) | course cards built from the course |
| `reviews` | eyebrow, heading, intro | all reviews |
| `instructorRow` / `instructorGrid` | (eyebrow, heading, text, link) / — | all instructors |
| `upcomingShows` | variant `list`/`byMonth`, eyebrow?, heading?, headerLink?, links[] | |
| `nextShowBanner` | link | hidden when no show is upcoming |
| `repertoire` | groups[{group, eyebrow, heading, intro}] | filterable together with `pageHero.repertoireFilter` |
| `contactCard` | eyebrow, heading, cta | primary contact person |
| `courseStarts` | course, eyebrow, heading, intro?, rolling? {text segments, note?, inquiry} | dated groups / rolling / empty |
| `coursePrices` | course, eyebrow, heading, intro? | |
| `courseCompare` | courses[], eyebrow, heading | |
| `upcomingWorkshops` | — | nothing when none upcoming |
| `pastWorkshops` | eyebrow, heading, limit | takes the anchor only when nothing is upcoming; empty state when there is neither |
| `openWorkshopSessions` | eyebrow, heading, intro, title, limit | |
| `programmes` | eyebrow, heading | |
| `quoteRequest` | eyebrow, heading, text, goals[], image | form texts from the UI dictionary |
| `contactPeople` | email {eyebrow, heading} | |
| `location` | eyebrow, heading, addressLines[], text | map from site settings |
| `legalDocument` | document (slug) | |
| `bioIntro`, `bioNextShow`, `linkList` (links[]), `socialLinks`, `contactFooter` | | link-in-bio page (`layout: minimal`) |

**Production pages** (`/repertoar/[slug]`) are a template, not block pages. Their sections follow the
production record, labels come from `ui.production`, and the closing band comes from
`siteSettings.productionPage.ctaBand`.

## Mapping to Payload

The changes below are made in `lib/data.ts` only.

- Pages: a collection with a `blocks` field; one Payload `Block` per variant (slug = `blockType`).
- References: `ctaBand`, `course`, `courses` and `switcher.pages` become `relationship` fields (to
  CTA bands, courses and pages). Images become `upload` fields that are resolved to `ImageRef`.
- Globals: `site-settings` and `ui`.
