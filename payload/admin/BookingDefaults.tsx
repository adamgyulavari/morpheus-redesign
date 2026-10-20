import type { UIFieldServerProps } from 'payload';

import { billingSettings } from '@/lib/payments/settings';

import { FillBookingDefaults } from './FillBookingDefaults';

/** In a show's "Saját foglalás": the defaults its price and seats start with (Fizetési beállítások). */
export async function BookingDefaults({ req }: UIFieldServerProps) {
  const { price, seats } = (await billingSettings(req.payload)).showDefaults;
  return <FillBookingDefaults price={price} seats={seats} />;
}
