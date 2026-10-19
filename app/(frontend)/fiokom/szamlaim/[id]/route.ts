/**
 * /fiokom/szamlaim/<id>: an invoice's PDF, fetched from Számlázz.hu — only for its owner and staff
 * (403 otherwise), never cached.
 */

import { getCurrentUser, payloadClient } from '@/lib/auth';
import { invoicePdfFor } from '@/lib/invoicing/service';
import { userIsStaffOrAdmin } from '@/payload/access';
import { relId } from '@/payload/rel';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response('Jelentkezz be.', { status: 401 });
  const id = Number((await params).id);
  const payload = await payloadClient();
  const invoice = id ? await payload.findByID({ collection: 'invoices', id, depth: 0, disableErrors: true }) : null;
  if (!invoice) return new Response('Nincs ilyen számla.', { status: 404 });
  if (relId(invoice.user) !== user.id && !userIsStaffOrAdmin(user))
    return new Response('Nincs jogosultság.', { status: 403 });
  const pdf = await invoicePdfFor(payload, invoice);
  if (!pdf) return new Response('A számla PDF-je most nem érhető el. Próbáld újra később.', { status: 502 });
  return new Response(new Blob([pdf as BlobPart]), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${(invoice.number ?? `szamla-${invoice.id}`).replace(/[^\w.-]/g, '_')}.pdf"`,
      'cache-control': 'private, no-store',
    },
  });
}
