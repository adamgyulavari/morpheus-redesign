/** The logged-in person as the forms show them (name, contact, saved billing details). */

import type { User } from '@/payload-types';
import type { Billing } from './billing';

const fullName = (u: User) => [u.lastName, u.firstName].filter(Boolean).join(' ');

/** The saved billing details, or the defaults (own name, Hungary). */
export function billingOf(u: User): Billing {
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

export function checkoutMe(viewer: User | null) {
  if (!viewer) return null;
  return { name: fullName(viewer), email: viewer.email, phone: viewer.phone ?? '', billing: billingOf(viewer) };
}

export type CheckoutMe = ReturnType<typeof checkoutMe>;
