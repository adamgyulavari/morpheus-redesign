/** Links into the checkout (safe for client components). */

/** A Nyitott Műhely date's checkout page: by its public code, never its sequential id. */
export const checkoutPath = (code: string) => `/fizetes?alkalom=${encodeURIComponent(code)}`;
