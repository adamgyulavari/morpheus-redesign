/** Admin preview / live preview: /next/preview turns on Next.js draft mode (for logged-in users) and redirects to the page. */
export const previewPath = (path: string) => `/next/preview?${new URLSearchParams({ path })}`;
