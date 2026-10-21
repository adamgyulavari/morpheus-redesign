# Design round

The map compares directions for a design that isn't settled yet. Entered by the first wrap, by `<description>`, or by `riff`.

Pin one representative state — the most common one — across every chip, so the only thing changing is the design. Say which state is pinned in the picker `scope`. `riff` never shows states; that's `states`.

## Name the set

Default 3, cap 5. A name and an axis each — "Quiet", "Editorial", "Dense" — never "Option A/B/C". Names describe the direction; axes are things like layout, density, personality, motion, or interaction model.

Two directions that differ only in accent or copy are one direction: replace one with a real alternative. Every chip must be a shippable answer to the brief — a sloppy variant doesn't widen the exploration, it just loses on execution and teaches nothing about the direction it represents.

A design round is where the design improves. Aim for modern design with current best practices applied — sharper hierarchy, calmer spacing, deliberate type and color. Today's screens are the floor, not the target: treat nearby UI as context rather than a pattern to follow. Write your own markup unless an existing component already matches the direction.

## Build

Put each variant next to the work, in the same folder, in its own file named after the direction — `QuietNotice`, not `OptionA`.

## Hand off

| #   | Variant | Axis                                 | When it's the right choice | Its cost       |
| --- | ------- | ------------------------------------ | -------------------------- | -------------- |
| 1   | Quiet   | Minimal motion, borders over shadows | Daily-use surface          | Less memorable |

Sell each direction honestly — one line on when it wins, one on what it costs. Do not pre-pick a favorite in the table. If the user asks which you'd choose, answer from the product's personality and frequency of use, not aesthetics alone. If two variants converged while you built them, cut one and say so.

## Fold in

Write the winner into the real component before anything else: shared structure into the shared view, copy and props into the branch that owns them. Fold custom markup in as it stands: rebuilding it out of existing components on the way in would undo the direction that won. Then delete the losing variant files.

The next round builds on the updated component, so nothing about the winner may stay behind in the map.
