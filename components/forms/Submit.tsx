'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

import { ArrowRight } from '@/components/icons';

/** The form's submit button: disabled while the action runs. `block`: the full width of its column. */
export default function Submit({ children, block = false }: { children: ReactNode; block?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn btn-lg btn-primary disabled:opacity-60 ${block ? 'w-full justify-center' : 'self-stretch sm:self-start'}`}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? 'Egy pillanat…' : children}
      {!pending && <ArrowRight />}
    </button>
  );
}
