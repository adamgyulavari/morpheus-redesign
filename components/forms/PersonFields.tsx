'use client';

/** Who fills in the form: the fields the account, sign-up and checkout forms share. */
import Link from 'next/link';
import type { ReactNode } from 'react';

import { tagged } from '@/components/tagged';
import { useUi } from '@/components/UiStrings';
import { fill } from '@/lib/format';

import Checkbox from './Checkbox';
import { TextField } from './Field';

type Value = (key: string) => string | null | undefined;

/** Family and given name side by side; `value`: each one's starting value. */
export function NameFields({ value }: { value: Value }) {
  const { forms } = useUi();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label={forms.lastName} name="lastName" autoComplete="family-name" value={value('lastName')} />
      <TextField label={forms.firstName} name="firstName" autoComplete="given-name" value={value('firstName')} />
    </div>
  );
}

/**
 * Logged in: whose name it goes under, and their phone. Otherwise: name, e-mail and phone, under
 * `guestNote` ("Van már fiókod? Lépj be…").
 */
export function PersonFields({
  me,
  value,
  guestNote,
}: {
  me: { name: string; email: string; phone?: string | null } | null;
  value: Value;
  guestNote?: ReactNode;
}) {
  const { forms } = useUi();
  const phone = (start?: string | null) => (
    <TextField label={forms.phone} type="tel" name="phone" autoComplete="tel" value={value('phone') ?? start} />
  );
  if (me)
    return (
      <>
        <p className="rounded-2xl bg-sand px-4 py-3 text-[15px] leading-relaxed text-ink2">
          {tagged(fill(forms.loggedInAs, { name: me.name, email: me.email }), {
            b: (chunk) => <strong className="font-semibold text-ink">{chunk}</strong>,
          })}
        </p>
        {phone(me.phone)}
      </>
    );
  return (
    <>
      {guestNote}
      <NameFields value={value} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={forms.email} type="email" name="email" autoComplete="email" value={value('email')} />
        {phone()}
      </div>
    </>
  );
}

/** "Van már fiókod? Lépj be" and how the sentence ends there (`after`). */
export function HaveAccount({ href, after, className }: { href: string; after: string; className: string }) {
  const { forms } = useUi();
  return (
    <p className={className}>
      {forms.haveAccount}{' '}
      <Link href={href} className="link font-semibold text-ink">
        {forms.logIn}
      </Link>
      {after}
    </p>
  );
}

/** "Elolvastam és elfogadom az adatkezelési tájékoztatót", required. */
export function PrivacyCheckbox() {
  return (
    <Checkbox name="privacy">
      {tagged(useUi().forms.privacy, {
        link: (chunk) => (
          <Link href="/adatkezelesi-tajekoztato/" className="link font-semibold text-ink" target="_blank">
            {chunk}
          </Link>
        ),
      })}
    </Checkbox>
  );
}
