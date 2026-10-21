'use client';

import { useUi } from '@/components/UiStrings';
import type { Billing } from '@/lib/payments/billing';

import { TextField } from './Field';

/**
 * The billing details' fields (checkout, /fiokom/adatok); the server checks them with
 * validateBilling. `value`: each one's starting value.
 */
export default function BillingFields({ value }: { value: (key: keyof Billing) => string | undefined }) {
  const { forms: t } = useUi();
  return (
    <>
      <TextField label={t.billingName} name="billingName" autoComplete="name" value={value('name')} />
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <TextField
          label={t.zip}
          name="zip"
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={10}
          value={value('zip')}
        />
        <TextField label={t.city} name="city" autoComplete="address-level2" value={value('city')} />
      </div>
      <TextField label={t.address} name="address" autoComplete="street-address" value={value('address')} />
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <TextField
          label={t.country}
          name="country"
          autoComplete="country"
          maxLength={2}
          value={value('country') ?? 'HU'}
        />
        <TextField label={t.taxNumber} name="taxNumber" required={false} value={value('taxNumber')} />
      </div>
    </>
  );
}
