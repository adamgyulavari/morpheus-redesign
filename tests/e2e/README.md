# End-to-end tests

Scripts that drive the real system: the database (Payload's local API), the running dev server
(pages, the payment webhook), Mailpit (the e-mails) and Chrome (the pages in a browser). Each
suite makes its own test data (accounts, dates, groups) and removes it at the end. The unit
tests are separate (`npm test`).

```sh
npm run test:e2e                    # all suites
npm run test:e2e -- emails kezdo    # the ones named
```

What they need:

- **The dev server** (`npm run dev`) at `E2E_BASE_URL` (default `http://localhost:3000`), on the
  same database as `.env`.
- **Mailpit** (`docker compose -f docker-compose.dev.yml up -d`) at `MAILPIT_URL` (default
  `http://localhost:8025`), with the dev server's SMTP pointed at it.
- **Chrome** at `CHROME_PATH` (default: the macOS app).
- For `payments` and `checkout-ui`: the dev server started with `PAYMENT_PROVIDER=mock` (the
  webhook goes to it). The other suites run the payment steps in their own process with the mock.
- `monthly-billing` also issues one real invoice on the **Számlázz.hu test account** when
  `SZAMLAZZ_AGENT_KEY` is set (never the real account's key — see DEPLOY.md).

Screenshots go to `E2E_OUT` (default: a new temporary folder). The suites print `PASS` / `FAIL`
lines; a failing suite exits non-zero.
