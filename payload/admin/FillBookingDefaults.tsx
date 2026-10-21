'use client';

import { useField } from '@payloadcms/ui';
import { useEffect } from 'react';

/**
 * Shown with "Saját foglalás" (the group's condition): the moment it is chosen, the empty price and
 * seats get the defaults, to keep or change before saving. Renders nothing.
 */
export function FillBookingDefaults({ price, seats }: { price: number; seats: number }) {
  const priceField = useField<number | null>({ path: 'booking.price' });
  const seatsField = useField<number | null>({ path: 'booking.seats' });
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, when the group appears
  useEffect(() => {
    if (priceField.value == null) priceField.setValue(price);
    if (seatsField.value == null) seatsField.setValue(seats);
  }, []);
  return null;
}
