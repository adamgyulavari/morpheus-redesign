'use client';

/**
 * Team-building quote request form. Client component for the validation message and the submit
 * handler; the actual "sending" is isolated in lib/quote-request.ts so it can become a Server Action.
 * Its texts come from the UI dictionary (ui.quoteForm).
 */
import { type FormEvent, useState } from 'react';

import { Field, TextField } from '@/components/forms/Field';
import { fill } from '@/lib/format';
import { type QuoteRequest, submitQuoteRequest } from '@/lib/quote-request';

import { ArrowRight } from './icons';
import { useUi } from './UiStrings';

export default function QuoteRequestForm({ recipient }: { recipient: string }) {
  const [showError, setShowError] = useState(false);
  const content = useUi().quoteForm;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setShowError(true);
      form.querySelector<HTMLElement>(':invalid')?.focus();
      return;
    }
    setShowError(false);
    const f = new FormData(form);
    const get = (k: keyof QuoteRequest) => String(f.get(k) ?? '').trim();
    const data: QuoteRequest = {
      company: get('company'),
      lastName: get('lastName'),
      firstName: get('firstName'),
      email: get('email'),
      phone: get('phone'),
      message: get('message'),
    };
    const result = submitQuoteRequest(data, {
      recipient,
      subject: fill(content.subject, { company: data.company }),
      labels: content.mail,
    });
    window.location.href = result.href;
  }

  const { fields } = content;
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-3xl border border-line bg-paper p-6 lg:gap-5 lg:p-10"
    >
      <h3 className="font-display text-[32px] leading-none lg:text-[40px]">{content.title}</h3>
      <p className="text-sm text-muted">{content.required}</p>
      <TextField label={fields.company} name="company" autoComplete="organization" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={fields.lastName} name="lastName" autoComplete="family-name" />
        <TextField label={fields.firstName} name="firstName" autoComplete="given-name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={fields.email} type="email" name="email" autoComplete="email" />
        <TextField label={fields.phone} type="tel" name="phone" autoComplete="tel" />
      </div>
      <Field label={fields.message}>
        <textarea className="field min-h-[140px]" name="message" rows={5} placeholder={content.messagePlaceholder} />
      </Field>
      <p className="text-sm font-semibold text-rust-dark" hidden={!showError} role="alert">
        {content.error}
      </p>
      <button type="submit" className="btn btn-lg btn-primary self-stretch sm:self-start">
        {content.submit}
        <ArrowRight />
      </button>
      <p className="text-xs leading-relaxed text-muted">{content.note}</p>
    </form>
  );
}
