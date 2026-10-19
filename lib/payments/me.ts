/** The logged-in person as the forms show them (name, contact, saved billing details). */
import type { TypedUser } from 'payload';

import type { Billing } from './billing';

const fullName = (u: TypedUser) => [u.lastName, u.firstName].filter(Boolean).join(' ');

/** The saved billing details, or the defaults (own name, Hungary). */
export function billingOf(u: TypedUser): Billing {
  const b = u.billing;
  return {
    name: b?.name || fullName(u),
    zip: b?.zip ?? '',
    city: b?.city ?? '',
    address: b?.address ?? '',
    country: b?.country || 'HU',
    taxNumber: b?.taxNumber ?? '',
  };
}

export function checkoutMe(viewer: TypedUser | null) {
  if (!viewer) return null;
  return { name: fullName(viewer), email: viewer.email, phone: viewer.phone ?? '', billing: billingOf(viewer) };
}

export type CheckoutMe = ReturnType<typeof checkoutMe>;
