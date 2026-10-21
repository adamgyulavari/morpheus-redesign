/**
 * /fiokom/szamlaim/<id>: an invoice's PDF, fetched from Számlázz.hu — only for its owner and staff
 * (403 otherwise), never cached.
 */

import { getCurrentUser, payloadClient } from '@/lib/auth';
import { invoicePdfFor } from '@/lib/invoicing/service';
import { userIsStaffOrAdmin } from '@/payload/access';
import { relId } from '@/payload/rel';
import { uiTexts } from '@/payload/ui-texts';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const [user, payload] = await Promise.all([getCurrentUser(), payloadClient()]);
  const ui = await uiTexts(payload);
  const t = ui.invoiceErrors;
  if (!user) return new Response(ui.accountErrors.loginAgain, { status: 401 });
  const id = Number((await params).id);
  const invoice = id ? await payload.findByID({ collection: 'invoices', id, depth: 0, disableErrors: true }) : null;
  if (!invoice) return new Response(t.notFound, { status: 404 });
  if (relId(invoice.user) !== user.id && !userIsStaffOrAdmin(user)) return new Response(t.forbidden, { status: 403 });
  const pdf = await invoicePdfFor(payload, invoice);
  if (!pdf) return new Response(t.unavailable, { status: 502 });
  return new Response(new Blob([pdf as BlobPart]), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${(invoice.number ?? `szamla-${invoice.id}`).replace(/[^\w.-]/g, '_')}.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
}
