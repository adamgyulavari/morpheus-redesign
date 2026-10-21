# Network scenarios

Load this when a state round reaches its states over the network. Skip it for design rounds, and for state rounds where every chip is a prop the component already takes or a store slice holding identity, role or permissions.

The tests already mock at this seam: `server.use(...)` over `msw/node`, factories for bodies, `resetApiState()` when a store is reused across cases. A state round needs the same handlers in a browser, which takes two things the test setup does not have.

Install once per repo. Both artifacts are prototype-only, so gitignore them alongside `Prototype.tsx`, and lint-ignore `src/dev/mswWorker.ts` wherever `Prototype.tsx` is lint-ignored:

1. `cd frontend && npx msw init public/` — generates `public/mockServiceWorker.js`. Decline its offer to record the path in `package.json`; that file is tracked and none of this ships.
2. Copy [mswWorker.ts](mswWorker.ts) to `src/dev/mswWorker.ts`.

`onUnhandledRequest: 'bypass'` leaves every endpoint you did not mock on the real backend. That is what makes interception safe inside a normal dev session. `startWorker` is a singleton so chip switches reuse the same activation instead of calling `start()` again.

The harness arms the scenario before the tree mounts. Both halves of that matter: a request fired before the worker activates is not intercepted, and RTK Query's cache lives in the store rather than the component, so the picker's remount on its own replays the previous chip's data.

```tsx
const Scenario = ({ handlers, children }: { handlers: RequestHandler[]; children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void startWorker()
      .then(() => {
        if (cancelled) {
          return;
        }
        worker.resetHandlers();
        worker.use(...handlers);
        dispatch(adminApiBase.util.resetApiState());
        setArmed(true);
      })
      .catch((error: unknown) => {
        console.error('[prototype] msw worker failed to start', error);
      });

    return () => {
      cancelled = true;
      worker.resetHandlers();
    };
  }, [handlers, dispatch]);

  return armed ? <>{children}</> : null;
};
```

Declare each scenario's handlers as a module-scope constant, one per chip. The effect keys off the `handlers` identity, so an array built inline in the variants map re-arms on every parent render — clearing handlers while the children are still mounted and dispatching `resetApiState()` again, which can re-render the parent and start the whole thing over.

A chip that stays blank means the worker never started; the `catch` above puts the reason in the console.

Reset the api slices the tree actually uses — `adminApiBase` for the admin tree, whichever slices apply elsewhere. Arm with `resetHandlers()` then `use(...)`: passing handlers straight to `resetHandlers` replaces msw's initial set permanently, so the cleanup call would restore the previous scenario instead of clearing it. Reset handlers on unmount rather than calling `worker.stop()`, which races activation across chip switches.

A scenario store under a nested `Provider` is the right seam for the user slice, but not for the cache: it isolates only the reads that go through React, while `getCommonStore()` in the websocket layer and `src/fetch.ts` — which imports the real store directly for its 401/403 interceptor — keep talking to the session store. Combine the two freely, and let `resetApiState()` own the cache either way.

Write handlers the way the tests do: factories from `src/factories` for bodies, `snakecaseKeys` around raw JSON because responses are camelized in transit, and read the query params so pagination and filters behave for real. The states come out of the response — `delay('infinite')` holds a loading state still, a 500 gives a real error path where retry works, `buildList(47)` gives volume.

Three things that bite: service workers need a secure context, so use `localhost` and not the LAN address `--host 0.0.0.0` exposes; re-run `msw init` after upgrading msw; pass `serviceWorker: { url }` when the app is served under a base path.
