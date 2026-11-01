/**
 * What sessions and room bookings share when they take rooms: validation errors, the clash check,
 * the admin's "override student practice" box and the "E-mail a diákoknak" box.
 */
import { type CheckboxField, type CollectionBeforeOperationHook, type PayloadRequest, ValidationError } from 'payload';

import { type Clash, findClashes } from '@/lib/rooms/occupancy';

import { isAdminField, userIsAdmin } from '../access';

/** Throws a field validation error of the collection (shown at the field in the admin). */
export const failer =
  (collection: 'sessions' | 'roomBookings' | 'applications') =>
  (path: string, message: string, req: PayloadRequest): never => {
    throw new ValidationError({ collection, errors: [{ path, message }] }, req.t);
  };

/**
 * Admins may cancel clashing student practice when placing something (the "Ütköző diákfoglalások
 * felülírása" box, or `req.context.overridePractice` from the calendar). Sessions and rentals always block.
 */
export const mayOverridePractice = (req: PayloadRequest, data?: { overridePractice?: boolean }) =>
  userIsAdmin(req.user) && Boolean(data?.overridePractice || req.context.overridePractice);

/** The confirmed bookings in the way — none when there are none, or the admin overrides only practice. */
export async function blockingClashes(
  req: PayloadRequest,
  rooms: number[],
  start: Date,
  end: Date,
  ownBooking: number | null | undefined,
  data: { overridePractice?: boolean },
): Promise<Clash[]> {
  const clashes = await findClashes(req.payload, req, rooms, start, end, ownBooking ? [ownBooking] : []);
  const overridable =
    clashes.length > 0 && clashes.every((c) => c.kind === 'practice') && mayOverridePractice(req, data);
  return overridable ? [] : clashes;
}

/** The admin-only override box (not stored). */
export const overridePracticeField = (description: string): CheckboxField => ({
  name: 'overridePractice',
  label: 'Ütköző diákfoglalások felülírása',
  type: 'checkbox',
  virtual: true,
  access: { create: isAdminField, update: isAdminField, read: isAdminField },
  admin: { position: 'sidebar', description },
});

/**
 * The admin forms' "E-mail a diákoknak" box (not stored, ticked by default): unticked, the practice
 * e-mails this save would send are left out. Needs `notifyFromForm` among the collection's hooks.
 */
export const notifyField = (
  description: string,
  condition?: NonNullable<CheckboxField['admin']>['condition'],
): CheckboxField => ({
  name: 'notify',
  label: 'E-mail a diákoknak',
  type: 'checkbox',
  virtual: true,
  defaultValue: true,
  admin: { position: 'sidebar', description, condition },
});

/** The box's answer for the whole save (`req.context.notify`, read by lib/rooms/notify); without the field (server code) nothing changes. */
export const notifyFromForm: CollectionBeforeOperationHook = ({ args, operation }) => {
  const data = 'data' in args ? (args.data as { notify?: boolean } | undefined) : undefined;
  if ((operation === 'create' || operation === 'update') && data?.notify === false) args.req.context.notify = false;
  return args;
};
