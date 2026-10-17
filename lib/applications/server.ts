/**
 * Sign-ups and applications on the server (no 'use server' here — see actions.ts, student-actions
 * and admin-actions). The rules are in rules.ts; this gathers the facts, applies them and writes
 * through the Local API, whose Applications hooks lock and count places (the guarantee).
 */
import { randomBytes } from 'node:crypto';

import { sql } from '@payloadcms/db-postgres';
import { createLocalReq, type Payload, type PayloadRequest, type TypedUser, type Where } from 'payload';
import { cache } from 'react';

import { dateRange } from '@/lib/dates';
import { billingSettings } from '@/lib/payments/settings';
import { momentText, whenText } from '@/lib/rooms/format';
import { placeOf } from '@/lib/rooms/occupancy';
import { errorMessage } from '@/lib/rooms/server';
import { dbOf } from '@/payload/db';
import { relId, relIds } from '@/payload/rel';
import type { CourseGroup, Session } from '@/payload-types';

import { APPLICATION_KINDS, type ApplicationKind, type ApplicationStatus, SIGNUP_KIND_OF_TYPE } from './labels';
import {
  type Applicant,
  huf,
  sendAccepted,
  sendCancellation,
  sendMessage,
  sendMoved,
  sendReceived,
  sendStaffCancellation,
  sendStaffNew,
  sendWorkshopCancelled,
  sendWorkshopConfirmed,
  type TargetInfo,
} from './notify';
import {
  type ApplicationRules,
  COUNTED_STATUSES,
  type CourseFacts,
  canApplyWithoutGroup,
  canCancel,
  canCancelCourse,
  canMove,
  canSignUpCourse,
  canSignUpWorkshop,
  canWithdraw,
  cutoffAt,
  cutoffOutcome,
  isCutoffDue,
  MIN_MOTIVATION,
  placesLeft,
  type RuleResult,
  type WorkshopFacts,
  workshopState,
} from './rules';
import { type ApplicationSettings, applicationSettings } from './settings';
import { IS_PAID, TAKES_PLACE } from './sql';

const all = { limit: 0, pagination: false } as const;
type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: string };

// ── transactions ────────────────────────────────────────────────────────────

/** Runs `fn` in one database transaction (Local API calls get the `req`). */
export async function inTransaction<T>(payload: Payload, fn: (req: PayloadRequest) => Promise<T>): Promise<T> {
  const req = await createLocalReq({}, payload);
  const id = await payload.db.beginTransaction();
  if (id != null) req.transactionID = id;
  try {
    const result = await fn(req);
    if (id != null) await payload.db.commitTransaction(id);
    return result;
  } catch (err) {
    if (id != null) await payload.db.rollbackTransaction(id);
    throw err;
  }
}

// ── facts ───────────────────────────────────────────────────────────────────

const inList = (list: readonly (string | number)[]) =>
  sql.join(
    list.map((s) => sql`${s}`),
    sql`, `,
  );

/** Per date or course: places taken (paid + held within the hold) and paid sign-ups. */
export type Taken = { taken: number; paid: number };
export const NOBODY: Taken = { taken: 0, paid: 0 };

/** Places taken and paid sign-ups per session or course group (lib/applications/sql.ts). */
export async function takenBy(
  payload: Payload,
  column: 'session_id' | 'course_group_id',
  ids: number[],
  req?: PayloadRequest,
): Promise<Map<number, Taken>> {
  if (!ids.length) return new Map();
  const db = await dbOf(payload, req);
  const { rows } = await db.execute(sql`
    SELECT ${sql.raw(column)} AS id,
      count(*) FILTER (WHERE ${TAKES_PLACE})::int AS taken,
      count(*) FILTER (WHERE ${IS_PAID})::int AS paid
    FROM applications WHERE ${sql.raw(column)} IN (${inList(ids)})
    GROUP BY ${sql.raw(column)}`);
  return new Map(rows.map((r) => [Number(r.id), { taken: Number(r.taken), paid: Number(r.paid) }]));
}

export function workshopFacts(s: Session, { taken, paid }: Taken): WorkshopFacts {
  return {
    start: new Date(s.start),
    cancelled: s.status === 'cancelled',
    workshopStatus: s.workshop?.workshopStatus ?? 'open',
    bookable: s.workshop?.bookable !== false,
    minParticipants: s.workshop?.minParticipants ?? 5,
    maxParticipants: s.workshop?.maxParticipants ?? null,
    taken,
    paid,
  };
}

export const signupKindOf = (g: Pick<CourseGroup, 'type' | 'signup'>): 'beginner' | 'professional' =>
  g.signup?.kind ?? SIGNUP_KIND_OF_TYPE[g.type] ?? 'beginner';

/** Groups whose sign-up may be open (the dates decide the rest). */
export const SIGNUP_ON: Where = { 'signup.mode': { in: ['open', 'window'] } };

export function courseFacts(g: CourseGroup, taken: number): CourseFacts {
  const mode = g.signup?.mode ?? 'closed';
  // the window's dates count only in "Időablakban"
  const inWindow = mode === 'window';
  return {
    kind: signupKindOf(g),
    enabled: mode !== 'closed',
    opensAt: inWindow && g.signup?.opensAt ? new Date(g.signup.opensAt) : null,
    // without an end: until the course starts
    closesAt: inWindow && g.signup?.closesAt ? new Date(g.signup.closesAt) : new Date(g.startDate),
    capacity: g.signup?.capacity ?? null,
    taken,
  };
}

export async function workshopInfo(payload: Payload, s: Session, rules: ApplicationRules): Promise<TargetInfo> {
  return {
    title: s.displayTitle ?? 'Nyitott Műhely',
    when: whenText(s.start, s.end, 'long'),
    place: await placeOf(payload, s),
    price: huf(s.workshop?.price),
    minParticipants: s.workshop?.minParticipants ?? 5,
    cutoff: cutoffAt(new Date(s.start), rules.workshopCutoffHours),
  };
}

export function courseInfo(g: CourseGroup): TargetInfo {
  return {
    title: g.title,
    when: dateRange(g.startDate.slice(0, 10), g.endDate.slice(0, 10)),
    price: g.signup?.priceLabel || huf(g.signup?.price),
  };
}

/** For staff: "6 fő fizetett (+2 fizetésre vár) — minimum 5, maximum 16". */
export const countText = ({ taken, paid }: Taken, s: Session) => {
  const min = s.workshop?.minParticipants ?? 5;
  const max = s.workshop?.maxParticipants;
  const held = taken - paid;
  return `${paid} fő fizetett${held > 0 ? ` (+${held} fizetésre vár)` : ''} — minimum ${min}${max ? `, maximum ${max}` : ''}`;
};

// ── the applicant ───────────────────────────────────────────────────────────

export type ApplicantInput = { lastName: string; firstName: string; email: string; phone: string };

/**
 * The logged-in user, or the account with this address — created (student, unverified) when there
 * is none. The answer is the same either way, so the form never tells whether an address had an account.
 */
export async function applicantFor(
  payload: Payload,
  viewer: TypedUser | null,
  input: ApplicantInput,
): Promise<{ applicant: Applicant; created: boolean }> {
  if (viewer) {
    return {
      applicant: {
        userId: viewer.id,
        name: viewer.name ?? `${viewer.lastName} ${viewer.firstName}`,
        firstName: viewer.firstName,
        email: viewer.email,
        phone: input.phone || viewer.phone,
      },
      created: false,
    };
  }
  const email = input.email.trim().toLowerCase();
  const find = async () =>
    (await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0 })).docs[0];
  let user = await find();
  let created = false;
  if (!user) {
    try {
      user = await payload.create({
        collection: 'users',
        data: {
          email,
          // they log in with links; the password is never told to anyone
          password: randomBytes(24).toString('base64url'),
          lastName: input.lastName,
          firstName: input.firstName,
          phone: input.phone || undefined,
          roles: ['student'],
          _verified: false,
        },
        disableVerificationEmail: true,
      });
      created = true;
    } catch (err) {
      // the same address signed up twice at once: the other request made the account
      user = await find();
      if (!user) throw err;
    }
  }
  return {
    applicant: {
      userId: user.id,
      // the form's name and phone are the application's snapshot; the account keeps its own
      name: `${input.lastName} ${input.firstName}`.trim(),
      firstName: input.firstName,
      email,
      phone: input.phone,
    },
    created,
  };
}

// ── signing up ──────────────────────────────────────────────────────────────

export type SignUpInput = ApplicantInput & {
  kind: ApplicationKind;
  sessionId?: number;
  /** Empty: without a group — only where the course takes those (`openWithoutGroup`). */
  courseGroupId?: number | null;
  /** The course (catalogue entry) of a group-less application. */
  courseId?: number | null;
  message?: string;
};

// the same rule as Payload's own e-mail field (ASCII local part), so an address passing here is
// never refused when the account is created
const EMAIL =
  /^(?!.*\.\.)[\w!#$%&'*+/=?^`{|}~-](?:[\w!#$%&'*+/=?^`{|}~.-]*[\w!#$%&'*+/=?^`{|}~-])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

/** Checks the form's fields (the rest is checked against the date or course). */
export function validateInput(input: SignUpInput, viewer: TypedUser | null): string | null {
  if (!viewer && (!input.lastName.trim() || !input.firstName.trim())) return 'Add meg a neved.';
  if (!viewer && !EMAIL.test(input.email.trim())) return 'Adj meg egy érvényes e-mail-címet.';
  if (!input.phone.trim() && !viewer?.phone) return 'Add meg a telefonszámod.';
  if (input.kind === 'professional' && (input.message ?? '').trim().length < MIN_MOTIVATION)
    return `Írj magadról legalább ${MIN_MOTIVATION} karaktert (motiváció, tapasztalat).`;
  return null;
}

/**
 * Signs up for a workshop date or a beginner course, or sends a professional application. E-mails
 * the applicant (a login link if they weren't logged in) and staff.
 */
export async function signUp(
  payload: Payload,
  viewer: TypedUser | null,
  input: SignUpInput,
  now = new Date(),
): Promise<Result<{ applicationId: number }>> {
  const invalid = validateInput(input, viewer);
  if (invalid) return { ok: false, reason: invalid };
  const settings = await applicationSettings(payload);

  let target: TargetInfo;
  if (input.kind === 'workshop') {
    // with online payment on, workshop sign-ups go through the checkout (lib/payments)
    if ((await billingSettings(payload)).online)
      return { ok: false, reason: 'Erre az alkalomra a fizetéssel lehet jelentkezni.' };
    const s = input.sessionId
      ? await payload.findByID({ collection: 'sessions', id: input.sessionId, depth: 0, disableErrors: true })
      : null;
    if (s?.kind !== 'workshop') return { ok: false, reason: 'Nincs ilyen alkalom.' };
    const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
    const verdict = canSignUpWorkshop(workshopFacts(s, taken), now, settings);
    if (!verdict.ok) return verdict;
    target = await workshopInfo(payload, s, settings);
  } else if (input.courseGroupId) {
    const g = await payload.findByID({
      collection: 'courseGroups',
      id: input.courseGroupId,
      depth: 0,
      disableErrors: true,
    });
    if (!g) return { ok: false, reason: 'Nincs ilyen kurzus.' };
    if (signupKindOf(g) !== input.kind) return { ok: false, reason: 'Erre a kurzusra így nem lehet jelentkezni.' };
    const taken = (await takenBy(payload, 'course_group_id', [g.id])).get(g.id)?.taken ?? 0;
    const verdict = canSignUpCourse(courseFacts(g, taken), now);
    if (!verdict.ok) return verdict;
    if (input.kind === 'beginner' && (await paysOnline(payload, relId(g.course))))
      return { ok: false, reason: 'Erre a kurzusra a fizetéssel lehet jelentkezni.' };
    target = courseInfo(g);
    input.courseId = null; // the group's own (the collection's hook)
  } else {
    // without a group: only where the course takes those
    const c = input.courseId
      ? await payload.findByID({ collection: 'courses', id: input.courseId, depth: 0, disableErrors: true })
      : null;
    if (!c || !canApplyWithoutGroup(c, input.kind))
      return { ok: false, reason: 'Erre a kurzusra most nem lehet jelentkezni.' };
    if (input.kind === 'beginner' && (await paysOnline(payload, c.id)))
      return { ok: false, reason: 'Erre a kurzusra a fizetéssel lehet jelentkezni.' };
    target = { title: c.title, withoutGroup: true };
    input.courseGroupId = null;
  }

  const { applicant, created } = await applicantFor(payload, viewer, input);
  let applicationId: number;
  try {
    const doc = await payload.create({
      collection: 'applications',
      data: {
        kind: input.kind,
        user: applicant.userId,
        session: input.kind === 'workshop' ? input.sessionId : null,
        courseGroup: input.kind === 'workshop' ? null : input.courseGroupId,
        course: input.kind === 'workshop' ? null : input.courseId,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        message: input.message?.trim() || null,
      },
    });
    applicationId = doc.id;
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }

  await sendReceived(payload, settings, applicant, input.kind, target, { created, loggedIn: Boolean(viewer) });
  await sendStaffNew(payload, settings, applicationId, APPLICATION_KINDS[input.kind], applicant, target, input.message);
  return { ok: true, applicationId };
}

// ── the participant: cancel, move ───────────────────────────────────────────

async function ownApplication(payload: Payload, user: TypedUser, id: number) {
  const a = await payload.findByID({ collection: 'applications', id, depth: 0, disableErrors: true });
  return a && relId(a.user) === user.id ? a : null;
}
export const applicantOf = (
  a: { user: unknown; name: string; email: string; phone?: string | null },
  firstName?: string | null,
): Applicant => ({
  userId: relId(a.user) ?? 0,
  name: a.name,
  firstName,
  email: a.email,
  phone: a.phone,
});

/** What may the participant do with an application now? (For the buttons; the actions re-check.) */
export async function allowedActions(
  payload: Payload,
  a: { kind: ApplicationKind; status?: ApplicationStatus | null; session?: unknown; courseGroup?: unknown },
  rules: ApplicationRules,
  now = new Date(),
): Promise<{ cancel: RuleResult; move: boolean }> {
  const no = { ok: false as const, reason: '' };
  if (!a.status) return { cancel: no, move: false };
  if (a.kind === 'professional') return { cancel: canWithdraw(a.status), move: false };
  if (a.kind === 'beginner') {
    const g = relId(a.courseGroup)
      ? await payload.findByID({
          collection: 'courseGroups',
          id: relId(a.courseGroup) ?? 0,
          depth: 0,
          disableErrors: true,
        })
      : null;
    if (a.status !== 'registered') return { cancel: no, move: false };
    // without a group (waiting to be placed): always
    return { cancel: g ? canCancelCourse(new Date(g.startDate), now) : { ok: true }, move: false };
  }
  const s = relId(a.session)
    ? await payload.findByID({ collection: 'sessions', id: relId(a.session) ?? 0, depth: 0, disableErrors: true })
    : null;
  if (!s) return { cancel: no, move: false };
  const facts = workshopFacts(s, NOBODY);
  const dateCancelled = facts.cancelled || facts.workshopStatus === 'cancelled';
  const cancel = a.status === 'registered' && !dateCancelled ? canCancel(facts.start, now, rules) : no;
  const move =
    (a.status === 'registered' || (a.status === 'cancelled' && dateCancelled)) && (dateCancelled || cancel.ok);
  return { cancel, move };
}

/** The participant cancels (workshop, beginner) or withdraws (professional). */
export async function cancelOwn(payload: Payload, user: TypedUser, id: number, now = new Date()): Promise<Result> {
  const a = await ownApplication(payload, user, id);
  if (!a) return { ok: false, reason: 'Nincs ilyen jelentkezésed.' };
  const settings = await applicationSettings(payload);
  const { cancel } = await allowedActions(payload, a, settings, now);
  if (!cancel.ok) return { ok: false, reason: cancel.reason || 'Ezt a jelentkezést már nem lehet lemondani.' };
  try {
    await payload.update({
      collection: 'applications',
      id,
      data:
        a.kind === 'professional'
          ? { status: 'withdrawn' }
          : { status: 'cancelled', cancelReason: 'A résztvevő lemondta.' },
    });
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
  const { info, count } = await targetAndCount(payload, a, settings);
  const who = applicantOf(a, user.firstName);
  await sendCancellation(payload, settings, who, info, 'self');
  await sendStaffCancellation(payload, settings, who, info, count);
  return { ok: true };
}

async function targetAndCount(
  payload: Payload,
  a: { kind: ApplicationKind; session?: unknown; courseGroup?: unknown },
  settings: ApplicationSettings,
): Promise<{ info: TargetInfo; count: string }> {
  if (a.kind === 'workshop') {
    const s = await payload.findByID({ collection: 'sessions', id: relId(a.session) ?? 0, depth: 0 });
    const taken = (await takenBy(payload, 'session_id', [s.id])).get(s.id) ?? NOBODY;
    return { info: await workshopInfo(payload, s, settings), count: countText(taken, s) };
  }
  const groupId = relId(a.courseGroup);
  if (!groupId) return { info: { title: APPLICATION_KINDS.professional }, count: '' };
  const g = await payload.findByID({ collection: 'courseGroups', id: groupId, depth: 0 });
  const taken = (await takenBy(payload, 'course_group_id', [g.id])).get(g.id)?.taken ?? 0;
  return { info: courseInfo(g), count: `${taken} fő${g.signup?.capacity ? ` (férőhely: ${g.signup.capacity})` : ''}` };
}

/** One click: the application moves to another open date (a new one; the old becomes `moved`). */
export async function moveOwn(
  payload: Payload,
  user: TypedUser,
  id: number,
  toSessionId: number,
  now = new Date(),
): Promise<Result<{ applicationId: number }>> {
  const a = await ownApplication(payload, user, id);
  if (a?.kind !== 'workshop' || !a.status) return { ok: false, reason: 'Nincs ilyen jelentkezésed.' };
  const status = a.status;
  const settings = await applicationSettings(payload);
  const [from, to] = await Promise.all([
    payload.findByID({ collection: 'sessions', id: relId(a.session) ?? 0, depth: 0, disableErrors: true }),
    payload.findByID({ collection: 'sessions', id: toSessionId, depth: 0, disableErrors: true }),
  ]);
  if (!from || to?.kind !== 'workshop') return { ok: false, reason: 'Nincs ilyen alkalom.' };
  const taken = await takenBy(payload, 'session_id', [from.id, to.id]);
  const verdict = canMove(
    { status, sessionId: from.id, workshop: workshopFacts(from, taken.get(from.id) ?? NOBODY) },
    { sessionId: to.id, workshop: workshopFacts(to, taken.get(to.id) ?? NOBODY) },
    now,
    settings,
  );
  if (!verdict.ok) return verdict;
  let applicationId: number;
  try {
    applicationId = await inTransaction(payload, async (req) => {
      // the new place first (counted under the lock), then the old one lets go
      const moved = await payload.create({
        collection: 'applications',
        data: {
          kind: 'workshop',
          user: user.id,
          session: to.id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          paidOffline: a.paidOffline,
          // paid online: the payment goes with it
          order: relId(a.order),
        },
        req,
      });
      await payload.update({ collection: 'applications', id: a.id, data: { status: 'moved', movedTo: moved.id }, req });
      return moved.id;
    });
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
  const [fromInfo, toInfo] = await Promise.all([
    workshopInfo(payload, from, settings),
    workshopInfo(payload, to, settings),
  ]);
  const who = applicantOf(a, user.firstName);
  await sendMoved(payload, who, fromInfo, toInfo);
  if (a.status === 'registered') {
    const left = (await takenBy(payload, 'session_id', [from.id])).get(from.id) ?? NOBODY;
    await sendStaffCancellation(payload, settings, who, fromInfo, countText(left, from), toInfo.when);
  }
  return { ok: true, applicationId };
}

// ── open workshop dates (public page, "move" choices, e-mails) ─────────────

export type OpenWorkshop = {
  id: number;
  /** The public code (checkout link). */
  code: string;
  title: string;
  description?: string | null;
  start: string;
  end: string;
  place?: string;
  price?: string;
  state: ReturnType<typeof workshopState>;
};

/** Upcoming workshop dates that aren't cancelled, with their state ("Még X jelentkező kell"…). */
export async function upcomingWorkshops(payload: Payload, now = new Date(), limit = 20): Promise<OpenWorkshop[]> {
  const settings = await applicationSettings(payload);
  const { docs } = await payload.find({
    collection: 'sessions',
    where: {
      and: [
        { kind: { equals: 'workshop' } },
        { status: { equals: 'scheduled' } },
        { 'workshop.workshopStatus': { not_equals: 'cancelled' } },
        { 'workshop.bookable': { equals: true } },
        { start: { greater_than: now.toISOString() } },
      ],
    },
    depth: 0,
    sort: 'start',
    limit,
  });
  const taken = await takenBy(
    payload,
    'session_id',
    docs.map((d) => d.id),
  );
  return Promise.all(
    docs.map(async (s) => ({
      id: s.id,
      code: s.code ?? '',
      title: s.title || 'Nyitott Műhely',
      description: s.workshop?.description,
      start: s.start,
      end: s.end,
      place: await placeOf(payload, s),
      price: huf(s.workshop?.price),
      state: workshopState(workshopFacts(s, taken.get(s.id) ?? NOBODY), now, settings),
    })),
  );
}

const leftText = (w: OpenWorkshop) =>
  w.state.state === 'open' || w.state.state === 'confirmed'
    ? w.state.left == null
      ? 'van hely'
      : `${w.state.left} szabad hely`
    : '';

// ── the cutoff (Payload job, every few minutes) ─────────────────────────────

/**
 * Decides the workshops whose cutoff has come: enough registered → "biztosan indul", else the date
 * is cancelled (its room booking released), the sign-ups cancelled ("minimum nem teljesült") and
 * the participants told, with the next open dates. Each date in its own transaction, under a lock.
 */
export async function runWorkshopCutoffs(payload: Payload, now = new Date()) {
  const settings = await applicationSettings(payload);
  const { docs } = await payload.find({
    collection: 'sessions',
    where: {
      and: [
        { kind: { equals: 'workshop' } },
        { status: { equals: 'scheduled' } },
        { 'workshop.workshopStatus': { equals: 'open' } },
        {
          start: { less_than_equal: new Date(now.getTime() + settings.workshopCutoffHours * 3_600_000).toISOString() },
        },
      ],
    },
    depth: 0,
    ...all,
  });
  const decided: { sessionId: number; outcome: 'confirmed' | 'cancelled' }[] = [];
  for (const candidate of docs) {
    try {
      const result = await inTransaction(payload, async (req) => {
        const db = await dbOf(payload, req);
        await db.execute(sql`SELECT id FROM sessions WHERE id = ${candidate.id} FOR UPDATE`);
        const s = await payload.findByID({ collection: 'sessions', id: candidate.id, depth: 0, req });
        const taken = (await takenBy(payload, 'session_id', [s.id], req)).get(s.id) ?? NOBODY;
        if (!isCutoffDue(workshopFacts(s, taken), now, settings)) return null;
        const { docs: participants } = await payload.find({
          collection: 'applications',
          where: { and: [{ session: { equals: s.id } }, { status: { in: [...COUNTED_STATUSES] } }] },
          depth: 1,
          req,
          ...all,
        });
        const outcome = cutoffOutcome(taken.paid, s.workshop?.minParticipants ?? 5);
        await payload.update({
          collection: 'sessions',
          id: s.id,
          // a cancelled session lets go of its room booking (Sessions hooks)
          data: {
            ...(outcome === 'cancelled' ? { status: 'cancelled' as const } : {}),
            workshop: { ...s.workshop, workshopStatus: outcome },
          },
          req,
          context: { workshopCutoff: true },
        });
        if (outcome === 'cancelled') {
          for (const p of participants)
            await payload.update({
              collection: 'applications',
              id: p.id,
              data: { status: 'cancelled', cancelReason: 'minimum nem teljesült' },
              req,
            });
        }
        return { s, outcome, participants };
      });
      if (!result) continue;
      decided.push({ sessionId: result.s.id, outcome: result.outcome });
      const info = await workshopInfo(payload, result.s, settings);
      const next =
        result.outcome === 'cancelled'
          ? (await upcomingWorkshops(payload, now, 6))
              .filter((w) => w.id !== result.s.id && (w.state.state === 'open' || w.state.state === 'confirmed'))
              .slice(0, 3)
              .map((w) => ({ when: whenText(w.start, w.end, 'long'), left: leftText(w) }))
          : [];
      for (const p of result.participants) {
        const who = applicantOf(p, typeof p.user === 'object' ? p.user?.firstName : null);
        if (result.outcome === 'confirmed') await sendWorkshopConfirmed(payload, settings, who, info);
        else await sendWorkshopCancelled(payload, settings, who, info, next);
      }
    } catch (err) {
      payload.logger.error({ err, msg: `workshop cutoff failed for session ${candidate.id}` });
    }
  }
  return decided;
}

// ── staff ───────────────────────────────────────────────────────────────────

/**
 * "Felvétel a kurzusba": the person joins the course group's students and may book rooms; a
 * professional application becomes `accepted` (with the group, if it had none). Welcome e-mail.
 */
export async function admit(payload: Payload, staff: TypedUser, id: number, groupId?: number | null): Promise<Result> {
  const a = await payload.findByID({ collection: 'applications', id, depth: 1, disableErrors: true });
  if (!a || a.kind === 'workshop') return { ok: false, reason: 'Ez nem kurzusjelentkezés.' };
  const targetId = relId(a.courseGroup) ?? groupId ?? null;
  if (!targetId) return { ok: false, reason: 'Válaszd ki, melyik csoportba veszed fel.' };
  const userId = relId(a.user);
  if (!userId) return { ok: false, reason: 'A jelentkezéshez nem tartozik fiók.' };
  if (a.kind === 'professional' && a.status !== 'new' && a.status !== 'interview')
    return { ok: false, reason: 'Ez a jelentkezés már le van zárva.' };
  if (a.kind === 'beginner' && a.status !== 'registered')
    return { ok: false, reason: 'Ez a jelentkezés már nem érvényes.' };
  let group: CourseGroup;
  try {
    group = await inTransaction(payload, async (req) => {
      const g = await payload.findByID({ collection: 'courseGroups', id: targetId, depth: 0, req });
      if (signupKindOf(g) !== a.kind) throw new Error('Ez a csoport nem ilyen jelentkezéshez való.');
      // a group-less kezdő application: placed first (the place is counted, under a lock)
      if (a.kind === 'beginner' && !relId(a.courseGroup))
        await payload.update({ collection: 'applications', id, data: { courseGroup: g.id }, req });
      await joinGroup(req, userId, g, staff);
      if (a.kind === 'professional')
        await payload.update({ collection: 'applications', id, data: { status: 'accepted', courseGroup: g.id }, req });
      return g;
    });
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
  const settings = await applicationSettings(payload);
  const firstName = typeof a.user === 'object' ? a.user?.firstName : null;
  await sendAccepted(payload, settings, applicantOf(a, firstName), courseInfo(group));
  return { ok: true };
}

/**
 * The person joins the group's students and may book rooms (staff can take that back on the
 * account) — Felvétel by staff (their rights apply), or a paid kezdő sign-up (the system).
 */
export async function joinGroup(req: PayloadRequest, userId: number, g: CourseGroup, staff?: TypedUser) {
  const students = relIds(g.students);
  if (!students.includes(userId))
    await req.payload.update({
      collection: 'courseGroups',
      id: g.id,
      data: { students: [...students, userId] },
      req,
      ...(staff ? { user: staff, overrideAccess: false } : {}),
    });
  await req.payload.update({ collection: 'users', id: userId, data: { roomBooking: true }, req });
}

/** Kezdő sign-up for this course goes through the checkout (lib/payments). */
export async function paysOnline(payload: Payload, courseId: number | null | undefined) {
  if (!courseId || !(await billingSettings(payload)).online) return false;
  const c = await payload.findByID({ collection: 'courses', id: courseId, depth: 0, disableErrors: true });
  return c?.signupMode === 'beginner' && Boolean(c.payOnline);
}

/** "Interjú" / "Elutasítás" (no e-mail: Fruzsi writes personally). */
export async function review(payload: Payload, id: number, status: 'interview' | 'rejected'): Promise<Result> {
  const a = await payload.findByID({ collection: 'applications', id, depth: 0, disableErrors: true });
  if (a?.kind !== 'professional') return { ok: false, reason: 'Ez nem szakmai jelentkezés.' };
  if (a.status !== 'new' && a.status !== 'interview')
    return { ok: false, reason: 'Ez a jelentkezés már le van zárva.' };
  await payload.update({ collection: 'applications', id, data: { status } });
  return { ok: true };
}

/** Adds someone to a workshop date by hand (an account is found or made, as on the site). */
export async function addParticipant(
  payload: Payload,
  sessionId: number,
  input: ApplicantInput,
): Promise<Result<{ applicationId: number }>> {
  const invalid = validateInput({ ...input, kind: 'workshop' }, null);
  if (invalid) return { ok: false, reason: invalid };
  const s = await payload.findByID({ collection: 'sessions', id: sessionId, depth: 0, disableErrors: true });
  if (s?.kind !== 'workshop') return { ok: false, reason: 'Nincs ilyen alkalom.' };
  const { applicant, created } = await applicantFor(payload, null, input);
  try {
    const doc = await payload.create({
      collection: 'applications',
      data: {
        kind: 'workshop',
        user: applicant.userId,
        session: s.id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
      },
    });
    const settings = await applicationSettings(payload);
    await sendReceived(payload, settings, applicant, 'workshop', await workshopInfo(payload, s, settings), {
      created,
      loggedIn: false,
    });
    return { ok: true, applicationId: doc.id };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}

/** Staff cancel a participant (an e-mail tells them). */
export async function cancelByStaff(payload: Payload, id: number): Promise<Result> {
  const a = await payload.findByID({ collection: 'applications', id, depth: 1, disableErrors: true });
  if (!a || a.kind === 'professional' || a.status !== 'registered')
    return { ok: false, reason: 'Ez a jelentkezés nem mondható le.' };
  await payload.update({
    collection: 'applications',
    id,
    data: { status: 'cancelled', cancelReason: 'A munkatársak lemondták.' },
  });
  const settings = await applicationSettings(payload);
  const { info } = await targetAndCount(payload, a, settings);
  await sendCancellation(
    payload,
    settings,
    applicantOf(a, typeof a.user === 'object' ? a.user?.firstName : null),
    info,
    'staff',
  );
  return { ok: true };
}

/** "E-mail a résztvevőknek": a free-text message to everyone registered for the date. */
export async function messageParticipants(
  payload: Payload,
  sessionId: number,
  subject: string,
  message: string,
): Promise<Result<{ sent: number }>> {
  if (!message.trim()) return { ok: false, reason: 'Írd be az üzenetet.' };
  const s = await payload.findByID({ collection: 'sessions', id: sessionId, depth: 0, disableErrors: true });
  if (s?.kind !== 'workshop') return { ok: false, reason: 'Nincs ilyen alkalom.' };
  const settings = await applicationSettings(payload);
  const info = await workshopInfo(payload, s, settings);
  const { docs } = await payload.find({
    collection: 'applications',
    where: { and: [{ session: { equals: s.id } }, { status: { in: [...COUNTED_STATUSES] } }] },
    depth: 1,
    ...all,
  });
  const title = subject.trim() || `Üzenet: ${info.title}, ${info.when ?? ''}`.trim();
  for (const p of docs)
    await sendMessage(
      payload,
      applicantOf(p, typeof p.user === 'object' ? p.user?.firstName : null),
      info,
      title,
      message,
    );
  return { ok: true, sent: docs.length };
}

/** The participant list of a date, for the admin panel. */
export async function participants(payload: Payload, sessionId: number) {
  const s = await payload.findByID({ collection: 'sessions', id: sessionId, depth: 0, disableErrors: true });
  if (s?.kind !== 'workshop') return null;
  const settings = await applicationSettings(payload);
  const { docs } = await payload.find({
    collection: 'applications',
    where: { session: { equals: s.id } },
    depth: 0,
    sort: 'createdAt',
    ...all,
  });
  const taken = docs.filter((d) => (COUNTED_STATUSES as readonly string[]).includes(d.status ?? '')).length;
  return {
    session: {
      id: s.id,
      start: s.start,
      end: s.end,
      status: s.status,
      workshopStatus: s.workshop?.workshopStatus ?? 'open',
    },
    min: s.workshop?.minParticipants ?? 5,
    max: s.workshop?.maxParticipants ?? null,
    taken,
    left: placesLeft(s.workshop?.maxParticipants, taken),
    cutoff: momentText(cutoffAt(new Date(s.start), settings.workshopCutoffHours)),
    list: docs.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone ?? '',
      status: d.status as ApplicationStatus,
      paidOffline: Boolean(d.paidOffline),
      createdAt: d.createdAt,
    })),
  };
}

// ── the admin dashboard ("Jelentkezések") ────────────────────────────────────

export type DashboardApplication = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: ApplicationStatus;
  paidOffline: boolean;
  paymentNote: string;
  message: string;
  createdAt: string;
  group?: { id: number; title: string };
  /** What it is for, as saved: the group, or "Kezdő kurzus (csoport nélkül)". */
  target: string;
};

const toDashboard = (a: {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status?: ApplicationStatus | null;
  paidOffline?: boolean | null;
  paymentNote?: string | null;
  message?: string | null;
  createdAt: string;
  courseGroup?: unknown;
  target?: string | null;
}): DashboardApplication => {
  const g = a.courseGroup && typeof a.courseGroup === 'object' ? (a.courseGroup as CourseGroup) : null;
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    phone: a.phone ?? '',
    status: a.status ?? 'registered',
    paidOffline: Boolean(a.paidOffline),
    paymentNote: a.paymentNote ?? '',
    message: a.message ?? '',
    createdAt: a.createdAt,
    group: g ? { id: g.id, title: g.title } : undefined,
    target: a.target ?? '',
  };
};

/**
 * What staff act on: the upcoming Nyitott Műhely dates with their participants (payment), the
 * beginner sign-ups not yet in their group (admission), the professional applications under review.
 */
export async function dashboard(payload: Payload, now = new Date()) {
  const settings = await applicationSettings(payload);
  const [{ docs: dates }, { docs: courseApps }, { docs: groups }] = await Promise.all([
    payload.find({
      collection: 'sessions',
      where: { and: [{ kind: { equals: 'workshop' } }, { end: { greater_than: now.toISOString() } }] },
      depth: 0,
      sort: 'start',
      limit: 30,
    }),
    payload.find({
      collection: 'applications',
      where: {
        or: [
          { and: [{ kind: { equals: 'beginner' } }, { status: { equals: 'registered' } }] },
          { and: [{ kind: { equals: 'professional' } }, { status: { in: ['new', 'interview'] } }] },
        ],
      },
      depth: 1,
      sort: 'createdAt',
      ...all,
    }),
    payload.find({
      collection: 'courseGroups',
      where: { endDate: { greater_than_equal: now.toISOString() } },
      depth: 0,
      sort: 'startDate',
      select: { title: true, type: true, students: true, signup: true, startDate: true },
      ...all,
    }),
  ]);
  const { docs: participants } = dates.length
    ? await payload.find({
        collection: 'applications',
        where: { session: { in: dates.map((d) => d.id) } },
        depth: 0,
        sort: 'createdAt',
        ...all,
      })
    : { docs: [] };
  const studentsOf = new Map(groups.map((g) => [g.id, relIds(g.students)]));
  const beginners = courseApps.filter((a) => a.kind === 'beginner' && awaitingAdmission(a, studentsOf));
  return {
    workshops: dates.map((s) => {
      const list = participants.filter((p) => relId(p.session) === s.id);
      const taken = list.filter((p) => (COUNTED_STATUSES as readonly string[]).includes(p.status ?? '')).length;
      return {
        id: s.id,
        when: whenText(s.start, s.end, 'long'),
        status: s.status === 'cancelled' ? ('cancelled' as const) : (s.workshop?.workshopStatus ?? 'open'),
        min: s.workshop?.minParticipants ?? 5,
        max: s.workshop?.maxParticipants ?? null,
        price: huf(s.workshop?.price),
        taken,
        cutoff: momentText(cutoffAt(new Date(s.start), settings.workshopCutoffHours)),
        participants: list.map(toDashboard),
      };
    }),
    beginners: beginners.map(toDashboard),
    professionals: courseApps.filter((a) => a.kind === 'professional').map(toDashboard),
    /** For "Felvétel és csoportba helyezés": the running and upcoming groups of each kind. */
    groups: {
      beginner: groups
        .filter((g) => signupKindOf(g as CourseGroup) === 'beginner')
        .map((g) => ({ id: g.id, title: g.title })),
      professional: groups
        .filter((g) => signupKindOf(g as CourseGroup) === 'professional')
        .map((g) => ({ id: g.id, title: g.title })),
    },
  };
}

/**
 * Course applications waiting for a decision (the sidebar badge, the admin home): kezdő sign-ups not
 * admitted yet, new szakmai ones. Once per render.
 */
export const countWaiting = cache(async (payload: Payload): Promise<number> => {
  const [{ docs: beginners }, { totalDocs: professionals }] = await Promise.all([
    payload.find({
      collection: 'applications',
      where: { and: [{ kind: { equals: 'beginner' } }, { status: { equals: 'registered' } }] },
      depth: 0,
      select: { user: true, courseGroup: true },
      ...all,
    }),
    payload.count({
      collection: 'applications',
      where: { and: [{ kind: { equals: 'professional' } }, { status: { equals: 'new' } }] },
    }),
  ]);
  const groupIds = [...new Set(beginners.flatMap((a) => relId(a.courseGroup) ?? []))];
  const { docs: groups } = groupIds.length
    ? await payload.find({
        collection: 'courseGroups',
        where: { id: { in: groupIds } },
        depth: 0,
        select: { students: true },
        ...all,
      })
    : { docs: [] };
  const studentsOf = new Map(groups.map((g) => [g.id, relIds(g.students)]));
  return beginners.filter((a) => awaitingAdmission(a, studentsOf)).length + professionals;
});

/** A kezdő sign-up still to admit: not among its group's students yet (a group-less one: until placed). */
function awaitingAdmission(a: { user?: unknown; courseGroup?: unknown }, studentsOf: Map<number, number[]>) {
  return !(studentsOf.get(relId(a.courseGroup) ?? 0) ?? []).includes(relId(a.user) ?? 0);
}

export type Decision = 'save' | 'admit' | 'interview' | 'reject' | 'cancel';

/**
 * One staff decision on an application, from the dashboard's dialog: the payment fields are saved
 * first, then the decision — in this order, in one call, so they can't race.
 * - admit: "Felvétel" (kezdő) / "Felvétel és csoportba helyezés" (szakmai, `groupId`)
 * - interview, reject: szakmai; reject on a kezdő sign-up archives it (no e-mail either way)
 * - cancel: a Nyitott Műhely participant (they get an e-mail)
 */
export async function decide(
  payload: Payload,
  staff: TypedUser,
  id: number,
  input: { decision: Decision; paid?: boolean; paymentNote?: string; groupId?: number | null },
): Promise<Result<{ message: string }>> {
  const a = await payload.findByID({ collection: 'applications', id, depth: 0, disableErrors: true });
  if (!a) return { ok: false, reason: 'Nincs ilyen jelentkezés.' };
  if (input.paid !== undefined || input.paymentNote !== undefined) {
    await payload.update({
      collection: 'applications',
      id,
      data: {
        ...(input.paid !== undefined ? { paidOffline: input.paid } : {}),
        ...(input.paymentNote !== undefined ? { paymentNote: input.paymentNote.trim() || null } : {}),
      },
    });
  }
  const saved = { ok: true as const, message: 'Mentve.' };
  switch (input.decision) {
    case 'save':
      return saved;
    case 'admit': {
      const r = await admit(payload, staff, id, input.groupId);
      return r.ok ? { ok: true, message: 'Felvéve a csoportba; az üdvözlő levél elment.' } : r;
    }
    case 'interview': {
      const r = await review(payload, id, 'interview');
      return r.ok ? { ok: true, message: 'Interjú állapotba téve.' } : r;
    }
    case 'reject': {
      if (a.kind === 'professional') {
        const r = await review(payload, id, 'rejected');
        return r.ok ? { ok: true, message: 'Elutasítva (e-mail nem ment).' } : r;
      }
      if (a.kind !== 'beginner' || a.status !== 'registered')
        return { ok: false, reason: 'Ez a jelentkezés már le van zárva.' };
      await payload.update({
        collection: 'applications',
        id,
        data: { status: 'cancelled', cancelReason: 'A munkatársak elutasították.' },
      });
      return { ok: true, message: 'Elutasítva, lekerült a listáról (e-mail nem ment).' };
    }
    case 'cancel': {
      const r = await cancelByStaff(payload, id);
      return r.ok ? { ok: true, message: 'Lemondva; a résztvevő e-mailt kapott.' } : r;
    }
  }
}
