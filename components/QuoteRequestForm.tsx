'use client';

/**
 * Team-building quote request form. Client component for the validation message and the submit
 * handler; the actual "sending" is isolated in lib/quote-request.ts so it can become a Server Action.
 */
import { useState, type FormEvent } from 'react';

import { fill } from '@/lib/format';
import { submitQuoteRequest, type QuoteRequest } from '@/lib/quote-request';
import type { QuoteFormContent } from '@/lib/types';

import { ArrowRight } from './icons';

export default function QuoteRequestForm({ content }: { content: QuoteFormContent }) {
  const [showError, setShowError] = useState(false);

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
      recipient: content.recipient,
      subject: fill(content.subject, { company: data.company }),
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
      <label className="field-label">
        {fields.company}
        <input className="field" name="company" required autoComplete="organization" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          {fields.lastName}
          <input className="field" name="lastName" required autoComplete="family-name" />
        </label>
        <label className="field-label">
          {fields.firstName}
          <input className="field" name="firstName" required autoComplete="given-name" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          {fields.email}
          <input className="field" type="email" name="email" required autoComplete="email" />
        </label>
        <label className="field-label">
          {fields.phone}
          <input className="field" type="tel" name="phone" required autoComplete="tel" />
        </label>
      </div>
      <label className="field-label">
        {fields.message}
        <textarea className="field min-h-[140px]" name="message" rows={5} placeholder={content.messagePlaceholder} />
      </label>
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
