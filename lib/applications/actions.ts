'use server';

/**
 * The sign-up forms on the public pages (/nyitott-alkalmak, the course pages) and the student
 * area's buttons. Bots: a honeypot field and rate limits per IP and per address (in memory, one
 * server process — like the login links).
 */
import { headers } from 'next/headers';

import { getCurrentUser, payloadClient } from '@/lib/auth';
import { allow, clientIp } from '@/payload/magic-link';

import type { ApplicationKind } from './labels';
import { cancelOwn, moveOwn, signUp } from './server';

export type SignUpState = { error?: string; done?: boolean; values?: Record<string, string> };

const MAX_PER_IP = 8;
const MAX_PER_EMAIL = 4;
const str = (form: FormData, name: string) => String(form.get(name) ?? '').trim();

/** One form for all three: `kind`, and `session`, or `courseGroup` ("none": without a group) and `course`. */
export async function signUpAction(_: SignUpState, form: FormData): Promise<SignUpState> {
  const values = {
    lastName: str(form, 'lastName'),
    firstName: str(form, 'firstName'),
    email: str(form, 'email').toLowerCase(),
    phone: str(form, 'phone'),
    message: str(form, 'message'),
    courseGroup: str(form, 'courseGroup'),
  };
  // honeypot: people don't see it, bots fill it in — they get the success answer, nothing happens
  if (str(form, 'website')) return { done: true };
  if (form.get('privacy') !== 'on')
    return { error: 'A jelentkezéshez el kell fogadnod az adatkezelési tájékoztatót.', values };

  const viewer = await getCurrentUser();
  const ip = clientIp(await headers());
  const email = viewer?.email ?? values.email;
  if (!allow(`signup-ip:${ip}`, MAX_PER_IP) || (email && !allow(`signup-email:${email}`, MAX_PER_EMAIL)))
    return { error: 'Túl sok jelentkezés érkezett innen rövid időn belül. Próbáld újra negyedóra múlva.', values };

  const kind = str(form, 'kind') as ApplicationKind;
  if (!['workshop', 'beginner', 'professional'].includes(kind)) return { error: 'Hibás jelentkezés.', values };
  const payload = await payloadClient();
  const r = await signUp(payload, viewer, {
    kind,
    sessionId: Number(form.get('session')) || undefined,
    courseGroupId: Number(values.courseGroup) || null,
    courseId: Number(form.get('course')) || null,
    lastName: values.lastName,
    firstName: values.firstName,
    email: values.email,
    phone: values.phone,
    message: values.message,
  });
  if (!r.ok) return { error: r.reason, values };
  // (the pages showing the places left re-render from the applications' hooks)
  return { done: true };
}

export async function cancelApplicationAction(id: number): Promise<{ ok: boolean; reason?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'Jelentkezz be újra.' };
  const r = await cancelOwn(await payloadClient(), user, id);
  return r.ok ? { ok: true } : r;
}

export async function moveApplicationAction(
  id: number,
  toSessionId: number,
): Promise<{ ok: boolean; reason?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'Jelentkezz be újra.' };
  const r = await moveOwn(await payloadClient(), user, id, toSessionId);
  return r.ok ? { ok: true } : r;
}

/** For prefilling the form: the logged-in person, or null (the pages themselves are cached). */
export async function whoAmI(): Promise<{ name: string; email: string; phone: string } | null> {
  const user = await getCurrentUser();
  return user
    ? { name: user.name ?? `${user.lastName} ${user.firstName}`, email: user.email, phone: user.phone ?? '' }
    : null;
}
