# Payment providers

Everything provider-specific lives in this folder. The rest of the code (`../service.ts`, the
webhook route, the jobs, the pages) only knows `../types.ts`.

- `index.ts` — picks the provider from `PAYMENT_PROVIDER` (the only place that does).
- `mollie.ts` — Mollie (`MOLLIE_API_KEY`; `test_…` / `live_…`).
- `mock.ts` — fake checkout at `/fizetes/mock/…` for development and tests; refused on a deployed site.

## Adding Barion (or another provider)

1. Create `barion.ts` implementing `PaymentProvider` from `../types.ts`:
   - `createPayment` — start a payment for the HUF amount, put our `orderId` in the provider's
     reference field, return its payment id and the URL to send the customer to.
   - `getPayment` — fetch the payment from the provider's API (never trust a callback's body) and
     map its statuses to `ProviderStatus` in this file; amounts back to whole forints.
   - `refund` — refund an amount (HUF) of a payment; use the provider's idempotency mechanism if any.
   - `parseWebhook` — read the provider's callback request and return only the payment id
     (Barion: `paymentId` in the callback's query/body); `null` when it isn't valid.
2. Set the env: its keys (e.g. `BARION_POS_KEY`), `PAYMENT_PROVIDER=barion`; add them to
   `.env.example` and DEPLOY.md.
3. Add `if (name === 'barion') return barionProvider;` to `index.ts`.
4. Point the provider's callback URL to `/api/payments/webhook` (some providers set it per payment,
   in `createPayment`).
5. Add its status mapping to the unit tests (see `mollie.test.ts`).

No other file should change; `grep -r barion lib app payload` outside this folder should find nothing.
