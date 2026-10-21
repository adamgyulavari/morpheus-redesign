# State round

One settled design, inspected across realistic states. Entered on the winner after a design round, or cold via `states <component>` to inspect a design that already shipped.

A state round does not choose a look. The design is already in the real component; the chips exist to check that it holds up under every state, role and shape of data. If a state reveals a design problem, fix it in the component — the fix lands for every chip — or `riff` to reopen the design.

## Name the set

Names are states, not aesthetics — "In progress", "Done", "Empty", "Mentor". Cover the states that actually differ in layout or copy, plus the ones most likely to break: empty, one item, many items, long strings, missing optional data, each role.

Same production component and same visual direction in every chip.

## Build

Render the folded component through the narrowest seam that reaches the state. Narrow means closest to the data and furthest from the markup — not fewest lines of fixture.

Compose the map at the wrap, with the production component in every chip. Simple scenarios need no extra files: a prop the component already takes stays a prop, and identity, role or permissions come from a scenario store under a nested `Provider`.

Patch the session's own state rather than building a store from fixtures. `getStoreWith` takes a partial preloaded state, so a scenario store is the live snapshot with one slice patched — the chip keeps the real session and differs only by the thing being inspected.

```tsx
import { getStoreWith } from '@polygence/common';
import { computeUtilities } from '@polygence/common/store/reducers/userReducer';
import { middlewares, reducers, store } from 'src/store';

const scenarioStore = (patch: Partial<UserState>) => {
  const state = store.getState();
  const user = { ...state.user, ...patch };

  return getStoreWith(
    { ...state, user: { ...user, utilities: computeUtilities(user.userType) } },
    reducers,
    middlewares,
  );
};

const asMentor = scenarioStore({ userType: 'mentor' });

variants={{
  Live: <ProjectList />,
  Empty: <ProjectList items={[]} />,
  One: <ProjectList items={[aProject]} />,
  Mentor: (
    <Provider store={asMentor}>
      <ProjectList />
    </Provider>
  ),
}}
```

`src/testStoreUtils.ts` is the wrong tool here despite looking like the right one: `getTestStore` preloads `DEFAULT_STATE` and `withUser` builds a factory user, so every slice becomes a fixture and the chip differs from the session in ways nobody asked to inspect.

Recompute `utilities` in any patch that touches `userType`, as above. Components read `utilities.isMentor` rather than comparing `userType`, and it is a stored field — patch the type alone and the chip renders the old role. The `updateUser` action has the same hole (`loadUser` is the one that recomputes), so don't reach for it either.

The snapshot carries the RTK Query cache along with the plain slices, which is usually what you want — the chip renders with the session's data already loaded instead of flashing empty. It also means those entries arrive with no subscriber in this tree, so a chip can sit on data it will never refetch. Omit the api keys from the patch when a state depends on the fetch actually happening.

Build each scenario store as a module-scope constant, one per chip. A store created inline in the variants map is rebuilt on every parent render, which throws away whatever the chip had loaded.

A nested `Provider` only redirects reads that go through React. Code that reads the store outside React keeps talking to the session store — `getCommonStore()` in the websocket layer, and `src/fetch.ts`, which imports the real store directly for its 401/403 interceptor. So a role chip renders that role's UI while its requests still authenticate as the logged-in user: right layout and copy, session-owned data. Mock the responses when a state needs both to agree.

Never fork the production UI into state-specific variants — a chip that renders different markup is measuring the fork, not the state. A harness may arm data and gate mounting. It may not contain product markup, layout or copy.

Children might own their queries in this repo, so most of the states are network handlers. Props stop being the narrow option the moment the state lives below the component you wrapped: threading a `query` prop down three layers to reach a grandchild's loading state edits production code and still reaches one endpoint; a handler reaches every endpoint in the tree and edits nothing. When the seam is the network, load [network-scenarios.md](network-scenarios.md) and follow it.

### Say the cost before building it

Build without comment when one handler set, one store slice, or props the component already takes reaches the states. Report the cost first when a state needs:

- more than two fixture layers lined up at once — store slice _and_ handlers _and_ seeded data;
- four or more endpoints mocked to reach a single state;
- response shapes you have to invent because no factory covers them;
- faking something the component only does at runtime: sockets, timers, browser APIs.

Say which states are cheap and which are expensive, then offer the two ways down: cut the expensive states and inspect the rest, or scope the round to the child that owns the state. Take the narrower option and carry on unless the user redirects — this is a cost report, not a second approval gate.

Production edits that exist only to let the picker reach a state are the one hard stop. If the component needs a seam it should have anyway, propose that change on its own merits instead of smuggling it in as prototype scaffolding.

## Hand off

| #   | State       | Scenario                              | What to inspect                      |
| --- | ----------- | ------------------------------------- | ------------------------------------ |
| 1   | In progress | Work exists and completion is partial | Progress clarity and the next action |

Describe the data or role that produces each state. State chips are inspection cases, not choices: describe each scenario neutrally, point out what to look at, and do not rank them or recommend one. No cost column — fixture cost was already reported before building.

## Fold in

The design was already folded before this round started, so a fold here only carries fixes found while inspecting — and those are structural, so they land in the shared view and change every chip.

Do not treat a state chip as a visual winner. `keep` needs no label in a state round; there is nothing to select.
