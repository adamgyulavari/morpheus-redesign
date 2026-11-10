/**
 * Cells of the Előadások list: Jegyek (booked here: seats taken / all, linking to the ticket list;
 * elsewhere: "Külső", greyed) and Címke (empty when there is none, not Payload's "<No Címke>").
 */
import type { DefaultServerCellComponentProps } from 'payload';

import { seatsTaken } from '@/lib/applications/shows';

const muted = { color: 'var(--theme-elevation-500)' } as const;

export async function TicketsCell({ rowData, payload }: DefaultServerCellComponentProps) {
  if (rowData.bookingMode !== 'internal') return <span style={muted}>Külső</span>;
  const taken = (await seatsTaken(payload, [rowData.id])).get(rowData.id) ?? 0;
  return (
    <a href={`/admin/jegyek/${rowData.id}`}>
      {taken} / {rowData.booking?.seats ?? 0}
    </a>
  );
}

export function LabelCell({ cellData }: DefaultServerCellComponentProps) {
  return cellData ? <span>{String(cellData)}</span> : null;
}
