/**
 * Team-building quote request. Today there is no backend, so submitting builds a prefilled e-mail
 * (mailto:) that the visitor sends from their own mail client.
 *
 * To move this to the server later: turn `submitQuoteRequest` into a Server Action (`'use server'`)
 * that e-mails or stores the request, and make the form call it — the form component only depends on
 * the `QuoteRequest` shape and the result type below.
 */
export type QuoteRequest = {
  company: string;
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  message: string;
};

export type QuoteRequestResult = { kind: 'mailto'; href: string };

export function submitQuoteRequest(data: QuoteRequest, options: { recipient: string; subject: string }): QuoteRequestResult {
  const body = [
    `Cég neve: ${data.company}`,
    `Kapcsolattartó: ${data.lastName} ${data.firstName}`,
    `E-mail: ${data.email}`,
    `Telefon: ${data.phone}`,
    '',
    data.message,
  ].join('\n');
  const href = `mailto:${options.recipient}?subject=${encodeURIComponent(options.subject)}&body=${encodeURIComponent(body)}`;
  return { kind: 'mailto', href };
}
