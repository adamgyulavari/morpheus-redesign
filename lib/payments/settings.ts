/** The "Fizetési beállítások" global, read once per request. */
import type { Payload } from 'payload';
import { cache } from 'react';

const count = (v: unknown, min: number, fallback: number) => (typeof v === 'number' && v >= min ? v : fallback);

export const billingSettings = cache(async (payload: Payload) => {
  const doc = await payload.findGlobal({ slug: 'billingSettings', depth: 0 });
  return {
    /** Off: sign-ups are free again (pay on site); orders already started still finish. */
    online: doc.onlinePayments !== false,
    vatMode: doc.vatMode ?? 'AAM',
    invoicePrefix: doc.invoicePrefix?.trim() ?? '',
    transferDueDays: typeof doc.transferDueDays === 'number' && doc.transferDueDays >= 1 ? doc.transferDueDays : 8,
    holdMinutes: typeof doc.ordersHoldMinutes === 'number' && doc.ordersHoldMinutes >= 5 ? doc.ordersHoldMinutes : 30,
    /** What a show booked on the site starts with (each show may change them). */
    showDefaults: {
      price: count(doc.showDefaults?.price, 0, 3500),
      seats: count(doc.showDefaults?.seats, 1, 30),
      maxPerBooking: count(doc.showDefaults?.maxPerBooking, 1, 10),
    },
  };
});
