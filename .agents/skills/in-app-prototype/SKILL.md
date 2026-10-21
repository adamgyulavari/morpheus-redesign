---
name: in-app-prototype
description: >
  Wraps a UI piece in a Prototype component so the developer can flip between
  design variants or component states live inside the running app. Always asks
  first whether variants are needed. Use when designing or changing UI, exploring
  alternative layouts or interaction models, or switching a component across
  states (empty, loading, complete, roles). Do not use for standalone HTML
  prototypes (that's the prototype skill) or when the user already knows the
  design and just wants it built.
---

# In-app prototype

Wrap a real piece of UI in `<Prototype>` so the developer can flip between versions of it inside the running app. The component brings its own picker, keyboard shortcuts and persistence — you only write the variant map. No sharable HTML, no review link: the developer decides and iterates alone.

Not the `prototype` skill. That one builds isolated HTML and never touches production code. This one lives in the running app and folds every decision straight into the real component — wrap the real call site when it exists; add a real app page when it doesn't.

## The model

Everything else follows from three ideas:

1. **The picker asks one question.** A round compares design directions _or_ states — never both in one map. Whatever is being decided right now is what's in the map.
2. **The code is the memory.** A design decision is not recorded until it is in the real component. The variant map is scratch; the component accumulates.
3. **Rounds replace, they don't nest.** A new round throws away the current set and builds a new one. There is no stack to pop and no map to restore — regenerating a set is cheap because the design lives in the component.

## Hard rules

1. **Ask first.** Do not scaffold variants unless the user says yes. Explicit invocation with a description counts as yes.
2. **It never ships.** Never commit `Prototype` — not the component, not the import, not the wrapper, not leftover variant files. Gitignore the copied component on first install and never `git add` it. In a clean checkout, a leftover import fails the build because the ignored runtime copy is absent. If a production build reuses a workspace containing that copy, it renders nothing (`null`) and reports to Sentry. A leftover `<Prototype>` is always a bug, never a fallback.
3. **One Prototype, one map, one question.** Multiple pickers overlap. Never mount a second one; replace the map instead.
4. **In the app.** Prefer the real call site or the component's export. If the piece has no home yet — new UI, unreachable route, live path renders `null` — add a real page in the app to host it, using the product's shell, router and tokens. Never `/prototypes`, never `public/*.html`, never a standalone HTML file (that's the `prototype` skill).
5. **Fold before replacing.** Every verb that replaces the map folds the pending design into the real component first. Nothing is carried between rounds in the map.

## Ask first

Before building or restyling UI, ask whether to prototype. Offer both uses:

- **Design variants** — different answers to the same brief (layout, density, motion, interaction).
- **State switching** — one design, several realistic states (empty / loaded / error, in progress / done, student / mentor).

If they say no, implement the thing. If they want both, do design first with one state pinned, then `states` on the winner. Do not combine them into one map unless they explicitly ask to see both axes at once.

## Install

The app cannot import React from a skills folder. Canonical source is [Prototype.tsx](references/Prototype.tsx) in this skill. The runtime copy lives in the app.

On first use in a repo:

1. Find the React app's `src` (the package that actually renders the UI).
2. Copy `Prototype.tsx` to `src/dev/Prototype.tsx`.
3. Append `src/dev/Prototype.tsx` (or the equivalent relative path) to that package's `.gitignore`.
4. If the package's lint command does not honor `.gitignore`, append the same path to its lint-ignore file.
5. Import with the project's alias conventions.

Leave the gitignored file in place across sessions so later runs reuse it.

## API

```tsx
import { Prototype } from 'src/dev/Prototype';

<Prototype
  name="foundation-notice"
  scope="Foundation notice · Active session"
  replay={false}
  position="bottom"
  variants={{
    Live: <NoticeLive />,
    Quiet: <QuietNotice />,
    Editorial: <EditorialNotice />,
    Dense: <DenseNotice />,
  }}
/>;
```

| Prop       | Default     | Role                                                                                                         |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `variants` | required    | Insertion-order map of label → node. Labels are picker items.                                                |
| `scope`    | required    | Human-readable picker context: the UI piece plus anything held constant across chips.                        |
| `name`     | `'default'` | Unique per exploration.                                                                                      |
| `replay`   | `false`     | Show ↻ and honor `R` when a variant has entrance motion worth re-triggering.                                 |
| `position` | `'bottom'`  | Initial dock if the user hasn't dragged. `'top'` when the piece occupies bottom-center (toast, sheet, dock). |

The component wires `1–9` / `←` / `→` / `R` and remounts on switch so entrances replay. Number keys select the first nine chips; arrows reach the whole map. Variant swap is instant; only the picker's highlight slides.

If the piece sits at the bottom-center of the screen, pass `position="top"` so the picker never covers the work — or drag it out of the way.

## A round

Decide the round type first, then load exactly one of these and follow it alongside the shared steps below:

- **Design round** — comparing directions for an unsettled design. See [DESIGN-ROUND.md](references/DESIGN-ROUND.md).
- **State round** — comparing states of a settled design. See [STATE-ROUND.md](references/STATE-ROUND.md).

The round file supplies the mode-specific detail for steps 2, 4, 5 and 6. Load [network-scenarios.md](references/network-scenarios.md) only when a state round reaches its states over the network.

### 1. Scope

One thing per run. If the request spans a whole view, pick the highest-leverage piece, say which and why, and offer the rest as follow-ups. Restate the brief in one sentence.

Give the picker a concise `scope` naming that UI piece and anything held constant across chips — for example, `Project list · Empty state` during a design round. Do not include the axis being switched; a state round over that component is simply `Project list`.

On the first round, map the stack so chips sit in the product's shell and on its tokens. Nearby screens are context, not a pattern library: lean on current design best practices for hierarchy, spacing, type and restraint, and write your own markup unless an existing component already fits the direction.

### 2. Name the set

List the set before writing any variant code. Naming rules are in the round file.

### 3. Add a baseline chip

First in the map, when one is meaningful:

- `Live` — the real component with real hooks and store data. Use it when the piece is wired up and reachable in a normal dev session, including on a new page that uses real data.
- `Current` — the accumulated component under controlled state. Use it when live data can't reach this state, the route isn't reachable, the live path renders `null`, or the host page exists only to provide fixtures.
- None — brand-new UI in its first round has nothing to compare against.

The baseline is a convenience for looking, never the storage. The component file is the storage.

### 4. Build

1. Install `Prototype` if missing (see [Install](#install)).
2. Wrap the real export or call site. If neither exists, add a page in the app and wrap there. Say where it is.
3. Compose the map as the round file describes.
4. Every chip fully works: real interactions, real motion, product-shaped copy. No lorem, no dead buttons.
5. Craft bar for anything that moves: `ease-out` on entrances (never `ease-in`), sub-300ms UI motion, correct `transform-origin`, `transform`/`opacity` only, `prefers-reduced-motion` handled.

Iteration rounds do not have to pass linting or type checking. Do not run either until `keep`.

### 5. Hand off

Say where it is in the app, the displayed scope, the labels, and the keys (`1–9` for the first nine chips, arrows for all, `R` if replay). Present the set using the round file's table and tone. Then stop — the next move is theirs.

### 6. Fold in

`riff` and `states` fold, then replace the map. `keep` folds, then unwraps. What a fold writes is in the round file.

## Verbs

| Invocation           | Behavior                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| (ambient UI work)    | Ask first; only continue if they want variants or states                                                     |
| `<description>`      | Ask skipped; full wrap workflow as a design round                                                            |
| `<description> x5`   | Same, that many design directions (cap 5)                                                                    |
| `riff <label>`       | Fold it in, then replace the map with new design directions derived from it, one representative state pinned |
| `states <label>`     | Fold it in, keep that design, and replace the map with realistic states of the same production component     |
| `states <component>` | No prior round: inspect an existing component's states                                                       |
| `in <label>, …`      | Patch that one chip                                                                                          |
| `keep <label>`       | Fold anything still pending, unwrap, ship                                                                    |

A verb with no label acts on the chip in view: `states` and `keep` are the common cases.

Unscoped feedback during a round applies to every chip when it's structural, and to the chip in view when it's copy.

## Where a change lands

Copy and props land on the chip that owns them. Anything structural — shared layout components, spacing, type, tokens — lands in the shared view and therefore changes every chip.

After folding in a structural change, flip through the other chips and confirm nothing broke. If two chips want contradicting structure, that is a real fork in the design: say so rather than quietly branching the component.

## Ship

On `keep`: fold in anything still pending, remove the `<Prototype>` wrapper and its import, and delete any leftover variant files — scenario handlers and any state harness included. Leave the gitignored dev files in place for next time: `src/dev/Prototype.tsx`, plus `src/dev/mswWorker.ts` and `public/mockServiceWorker.js` if a state round added them.

Only now run the relevant lint and type checks, and fix the kept code. If the piece has tests, they exercise the states without the picker and are the more reliable check that the accumulated design holds across roles and data.
