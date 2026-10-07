import config from '@payload-config';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { getPayload } from 'payload';

/**
 * Admin preview / live preview: for a logged-in editor, turns on Next.js draft mode (drafts are
 * shown instead of the published content) and redirects to the page.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const path = req.nextUrl.searchParams.get('path') ?? '';
  // only site-relative paths, never another host
  if (!path.startsWith('/') || path.startsWith('//')) return new Response('Invalid path', { status: 400 });

  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  const draft = await draftMode();
  if (!user) {
    draft.disable();
    return new Response('Az előnézethez be kell jelentkezni az admin felületre.', { status: 403 });
  }
  draft.enable();
  redirect(path);
}
