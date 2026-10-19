/** The buyer's details for invoices: checked the same way at checkout and in /fiokom/adatok. */

/** The buyer on the invoice (a snapshot on the order; the account keeps its own copy). */
export type Billing = { name: string; zip: string; city: string; address: string; country: string; taxNumber: string };

export function validateBilling(b: Billing): string | null {
  if (!b.name.trim()) return 'Add meg a számlázási nevet.';
  const country = b.country.trim().toUpperCase() || 'HU';
  if (!/^[A-Z]{2}$/.test(country)) return 'Az ország kétbetűs kódja kell (pl. HU).';
  if (country === 'HU' ? !/^\d{4}$/.test(b.zip.trim()) : !b.zip.trim()) return 'Add meg az irányítószámot.';
  if (!b.city.trim()) return 'Add meg a várost.';
  if (!b.address.trim()) return 'Add meg a címet (utca, házszám).';
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
