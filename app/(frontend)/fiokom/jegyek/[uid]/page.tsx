import { notFound } from 'next/navigation';

import AccountShell from '@/components/account/AccountShell';
import { Card } from '@/components/account/Card';
import { accountMetadata } from '@/components/account/meta';
import { showInfo } from '@/lib/applications/shows';
import { ticketPath, ticketSvg } from '@/lib/applications/tickets';
import { payloadClient, requireUser } from '@/lib/auth';
import { getUi } from '@/lib/data';
import { fill } from '@/lib/format';
import { relId } from '@/payload/rel';

// per visitor, never cached
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => accountMetadata((await getUi()).showBooking.myTickets);

type Props = { params: Promise<{ uid: string }> };

/** /fiokom/jegyek/<booking's uid>: the person's tickets for a show, one QR code each — to show at the door. */
export default async function MyTicketsPage({ params }: Props) {
  const { uid } = await params;
  const user = await requireUser(`/fiokom/jegyek/${uid}`);
  const payload = await payloadClient();
  const { docs } = await payload.find({
    collection: 'applications',
    where: { uid: { equals: uid } },
    depth: 0,
    limit: 1,
  });
  const a = docs[0];
  if (a?.kind !== 'show' || relId(a.user) !== user.id || a.status !== 'registered' || !a.tickets?.length) notFound();
  const s = await payload.findByID({ collection: 'shows', id: relId(a.show) ?? 0, depth: 1, disableErrors: true });
  if (!s) notFound();
  const [ui, info] = [await getUi(), showInfo(s)];
  const b = ui.showBooking;
  const codes = await Promise.all(a.tickets.map(async (t) => ({ ...t, svg: await ticketSvg(t.code) })));

  return (
    <AccountShell eyebrow={b.myTickets} heading={`*${info.title}*`}>
      <p className="text-[16px] text-ink2">
        {info.when}
        {info.place && ` · ${info.place}`}
      </p>
      <p className="text-[15px] text-muted">{b.myTicketsIntro}</p>
      {codes.map((t, i) => (
        <Card key={t.code} className="items-center">
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: our own QR code's SVG */}
          <a href={ticketPath(t.code)} className="w-[240px] max-w-full" dangerouslySetInnerHTML={{ __html: t.svg }} />
          <p className="text-[16px] font-semibold">
            {fill(b.ticketOf, { n: String(i + 1), of: String(codes.length) })}
            {t.usedAt && <span className="font-normal text-muted"> · {b.ticketUsedShort}</span>}
          </p>
        </Card>
      ))}
    </AccountShell>
  );
}
