/** The buyer's details for invoices: checked the same way at checkout and in /fiokom/adatok. */
import type { UiStrings } from '@/payload/ui-catalogue';

/** The buyer on the invoice (a snapshot on the order; the account keeps its own copy). */
export type Billing = { name: string; zip: string; city: string; address: string; country: string; taxNumber: string };

/** The first missing or wrong detail, in words (`t`: Felületi szövegek → Üzenetek → Számlázási adatok). */
export function validateBilling(b: Billing, t: UiStrings['billingErrors']): string | null {
  if (!b.name.trim()) return t.name;
  const country = b.country.trim().toUpperCase() || 'HU';
  if (!/^[A-Z]{2}$/.test(country)) return t.country;
  if (country === 'HU' ? !/^\d{4}$/.test(b.zip.trim()) : !b.zip.trim()) return t.zip;
  if (!b.city.trim()) return t.city;
  if (!b.address.trim()) return t.address;
  return null;
}

export const clean = (b: Billing): Billing => ({
  name: b.name.trim(),
  zip: b.zip.trim(),
  city: b.city.trim(),
  address: b.address.trim(),
  country: b.country.trim().toUpperCase() || 'HU',
  taxNumber: b.taxNumber.trim(),
});
