/** Links into the checkout (safe for client components). */

/** A Nyitott Műhely date's checkout page: by its public code, never its sequential id. */
export const checkoutPath = (code: string) => `/fizetes?alkalom=${encodeURIComponent(code)}`;

/** A kezdő course's checkout: by its slug, and a group's public code (none: choose a group). */
export const courseCheckoutPath = (slug: string, groupCode?: string) =>
  `/fizetes/kurzus/${encodeURIComponent(slug)}${groupCode ? `?csoport=${encodeURIComponent(groupCode)}` : ''}`;
