import config from '@payload-config';
import { getPayload } from 'payload';

import { revalidateDateDependent } from '@/payload/revalidate';

/**
 * Re-renders the date-dependent pages (upcoming shows, course starts, sessions, workshops), so
 * past items drop off. Called every hour by the `revalidateDates` Payload job (payload.config.ts);
 * authorised with the Payload secret.
 */
export async function POST(req: Request): Promise<Response> {
  const payload = await getPayload({ config });
  if (req.headers.get('authorization') !== `Bearer ${payload.secret}`)
    return new Response('Unauthorized', { status: 401 });
  await revalidateDateDependent(payload);
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
