/** The "Jelentkezési beállítások" global, read once per request. */
import type { Payload, PayloadRequest } from 'payload';

import { type ApplicationRules, DEFAULT_RULES } from './rules';

export type EmailTexts = Partial<
  Record<
    'signupReceived' | 'applicationReceived' | 'confirmed' | 'cancelledMinimum' | 'cancellation' | 'accepted',
    string
  >
>;

export type ApplicationSettings = ApplicationRules & { notifyEmails: string[]; texts: EmailTexts };

export function settingsFrom(doc: Record<string, unknown> | null | undefined): ApplicationSettings {
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && v >= 0 ? v : fallback);
  const emails = Array.isArray(doc?.notifyEmails)
    ? (doc.notifyEmails as { email?: string | null }[]).flatMap((e) => (e.email?.trim() ? [e.email.trim()] : []))
    : [];
  const texts = (doc?.texts ?? {}) as Record<string, string | null | undefined>;
  return {
    workshopCutoffHours: num(doc?.workshopCutoffHours, DEFAULT_RULES.workshopCutoffHours),
    userCancelHours: num(doc?.userCancelHours, DEFAULT_RULES.userCancelHours),
    notifyEmails: emails,
    texts: Object.fromEntries(Object.entries(texts).filter(([, v]) => typeof v === 'string' && v.trim())) as EmailTexts,
  };
}

/** From a request (cached on it — afterRead hooks call it once per document) or a Payload instance. */
export async function applicationSettings(from: PayloadRequest | Payload): Promise<ApplicationSettings> {
  const req = 'payload' in from && 'context' in from ? (from as PayloadRequest) : null;
  const cached = req?.context.applicationSettings as ApplicationSettings | undefined;
  if (cached) return cached;
  const payload = req ? req.payload : (from as Payload);
  const doc = await payload.findGlobal({ slug: 'applicationSettings', depth: 0, ...(req ? { req } : {}) });
  const settings = settingsFrom(doc as unknown as Record<string, unknown>);
  if (req) req.context.applicationSettings = settings;
  return settings;
}
