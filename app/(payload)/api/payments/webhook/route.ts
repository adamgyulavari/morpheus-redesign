/**
 * POST /api/payments/webhook — the payment provider's callback (provider-agnostic):
 * the provider parses out only the payment id; its state is then fetched from the provider, never
 * taken from the request. Unknown or malformed: 200 (nothing revealed). Our own failure: 500, so
 * the provider retries (typically for about a day). Follow-ups run as jobs.
 */
import config from '@payload-config';
import { getPayload } from 'payload';

import { paymentProvider } from '@/lib/payments/providers';
import { applyPaymentUpdate } from '@/lib/payments/service';

export async function POST(req: Request) {
  const payload = await getPayload({ config });
  let id: string | null = null;
  try {
    id = (await paymentProvider().parseWebhook(req))?.providerPaymentId ?? null;
  } catch {
    id = null;
  }
  if (!id) return new Response(null, { status: 200 });
  try {
    await applyPaymentUpdate(payload, id, 'webhook');
  } catch (err) {
    payload.logger.error({ err, msg: `payment webhook failed for ${id}` });
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 200 });
}
