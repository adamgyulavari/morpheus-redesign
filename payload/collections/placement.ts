/**
 * What sessions and room bookings share when they take rooms: validation errors, the clash check
 * and the admin's "override student practice" box.
 */
import { type CheckboxField, type PayloadRequest, ValidationError } from 'payload';

import { type Clash, findClashes } from '@/lib/rooms/occupancy';

import { isAdminField, userIsAdmin } from '../access';

/** Throws a field validation error of the collection (shown at the field in the admin). */
export const failer =
  (collection: 'sessions' | 'roomBookings') =>
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
