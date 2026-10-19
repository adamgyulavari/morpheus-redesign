/** The logged-in person as the checkout form shows them (name, contact, saved billing details). */
import type { TypedUser } from 'payload';

export function checkoutMe(viewer: TypedUser | null) {
  if (!viewer) return null;
  const name = [viewer.lastName, viewer.firstName].filter(Boolean).join(' ');
  const b = viewer.billing;
  return {
    name,
    email: viewer.email,
    phone: viewer.phone ?? '',
    billing: {
      billingName: b?.name || name,
      zip: b?.zip ?? '',
      city: b?.city ?? '',
      address: b?.address ?? '',
      country: b?.country || 'HU',
      taxNumber: b?.taxNumber ?? '',
    },
  };
}

export type CheckoutMe = ReturnType<typeof checkoutMe>;
