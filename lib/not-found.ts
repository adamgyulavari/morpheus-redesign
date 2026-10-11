import 'server-only';

import { notFound, permanentRedirect, redirect } from 'next/navigation';

import { getRedirect } from './data';

/** For a path with no page: follow a redirect (Átirányítások) if there is one, otherwise 404. */
export async function redirectOrNotFound(path: string): Promise<never> {
  const target = await getRedirect(path);
  if (!target) notFound();
  return target.permanent ? permanentRedirect(target.href) : redirect(target.href);
}
