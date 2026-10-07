import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

/** Leaves draft mode and returns to the page (or the homepage). */
export async function GET(req: NextRequest): Promise<Response> {
  (await draftMode()).disable();
  const path = req.nextUrl.searchParams.get('path') ?? '/';
  redirect(path.startsWith('/') && !path.startsWith('//') ? path : '/');
}
