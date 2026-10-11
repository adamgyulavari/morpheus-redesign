import type { Access, FieldAccess } from 'payload';

/**
 * Roles (a user can have several):
 * - `admin`: everything, including users and roles;
 * - `staff`: edits all content and courses in /admin, cannot manage roles (or delete legal pages);
 * - `student`: logs in on the public site only (/belepes, /fiokom), never in /admin.
 * Visitors (no user) read published content.
 */
export type Role = 'admin' | 'staff' | 'student';

export const ROLES: { label: string; value: Role }[] = [
  { label: 'Adminisztrátor', value: 'admin' },
  { label: 'Munkatárs', value: 'staff' },
  { label: 'Hallgató', value: 'student' },
];

type MaybeUser = { id?: number | string; roles?: Role[] | null } | null | undefined;

export const hasRole = (user: unknown, role: Role): boolean => Boolean((user as MaybeUser)?.roles?.includes(role));
/** Plain checks on a user object, for code outside access functions (pages, hooks). */
export const userIsAdmin = (user: unknown): boolean => hasRole(user, 'admin');
export const userIsStaffOrAdmin = (user: unknown): boolean => hasRole(user, 'admin') || hasRole(user, 'staff');

export const anyone: Access = () => true;
export const isAdmin: Access = ({ req: { user } }) => userIsAdmin(user);
export const isStaffOrAdmin: Access = ({ req: { user } }) => userIsStaffOrAdmin(user);

/** Only the user's own account. */
export const isSelf: Access = ({ req: { user } }) => (user ? { id: { equals: user.id } } : false);

/** Staff and admins: every account; anyone else logged in: only their own. */
export const isSelfOrStaff: Access = (args) => (userIsStaffOrAdmin(args.req.user) ? true : isSelf(args));

export const isAdminField: FieldAccess = ({ req: { user } }) => userIsAdmin(user);
export const isStaffOrAdminField: FieldAccess = ({ req: { user } }) => userIsStaffOrAdmin(user);

/** Staff see drafts; everyone else (visitors and students) only published documents. */
export const publishedOrStaff: Access = ({ req: { user } }) =>
  userIsStaffOrAdmin(user) ? true : { _status: { equals: 'published' } };

/** Content collections: public read, staff/admin write. */
export const contentAccess = { read: anyone, create: isStaffOrAdmin, update: isStaffOrAdmin, delete: isStaffOrAdmin };

/** Draft-enabled collections: only staff see drafts. */
export const draftContentAccess = { ...contentAccess, read: publishedOrStaff };
