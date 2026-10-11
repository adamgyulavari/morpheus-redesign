/**
 * The public address of the site (NEXT_PUBLIC_SERVER_URL), read when the server runs.
 * Next.js inlines `process.env.NEXT_PUBLIC_…` — even `process.env['NEXT_PUBLIC_…']` — at build
 * time, and the Docker build has no environment, so the name is assembled at runtime.
 */
export function serverUrl(): string {
  const name = ['NEXT', 'PUBLIC', 'SERVER', 'URL'].join('_');
  return (process.env[name] ?? '').replace(/\/+$/, '');
}
