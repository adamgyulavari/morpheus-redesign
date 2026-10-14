/** The "Fizetési beállítások" global, read once per request. */
import type { Payload } from 'payload';
import { cache } from 'react';

export const billingSettings = cache(async (payload: Payload) => {
  const doc = await payload.findGlobal({ slug: 'billingSettings', depth: 0 });
  return {
    /** Off: sign-ups are free again (pay on site); orders already started still finish. */
    online: doc.onlinePayments !== false,
    vatMode: doc.vatMode ?? 'AAM',
    holdMinutes: typeof doc.ordersHoldMinutes === 'number' && doc.ordersHoldMinutes >= 5 ? doc.ordersHoldMinutes : 30,
  };
});

export const PAUSED = 'Az online fizetés jelenleg szünetel.';
