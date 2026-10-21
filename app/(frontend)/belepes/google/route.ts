/** "Folytatás Google-fiókkal": off to Google (lib/google/oauth), remembering where to come back to. */
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { safeReturnPath } from '@/lib/auth';
import { googleConfigured, start } from '@/lib/google/oauth';
import { COOKIE, COOKIE_PATH, encode, MAX_AGE, redirectUri, siteAddress } from '@/lib/google/round-trip';

export async function GET(req: NextRequest) {
  if (!googleConfigured()) return NextResponse.redirect(siteAddress(req, '/belepes'));
  const { pending, url } = start(redirectUri(req), safeReturnPath(req.nextUrl.searchParams.get('vissza')));
  (await cookies()).set({
    name: COOKIE,
    value: encode(pending),
    path: COOKIE_PATH,
    maxAge: MAX_AGE,
    httpOnly: true,
    // Lax: Google's redirect back is a top-level GET, which carries it
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return NextResponse.redirect(url);
}
