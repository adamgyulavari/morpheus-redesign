import type { Access, FieldAccess } from 'payload';

/**
 * Roles: `admin` can do everything, including managing users; `editor` can edit all content but
 * cannot manage users (and cannot delete legal pages). Visitors (no user) only read published content.
 */
export type Role = 'admin' | 'editor';

const roleOf = (user: unknown): Role | undefined => (user as { role?: Role } | null)?.role;

export const anyone: Access = () => true;
export const loggedIn: Access = ({ req: { user } }) => Boolean(user);
export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin';
export const isAdminField: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin';

/** Admins: everyone; anyone else: only their own account. */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (roleOf(user) === 'admin') return true;
  return { id: { equals: user.id } };
};

/** Logged-in users see drafts; visitors only published documents. */
export const publishedOrLoggedIn: Access = ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } });

/** Content collections: public read, logged-in (admin or editor) write. */
export const contentAccess = { read: anyone, create: loggedIn, update: loggedIn, delete: loggedIn };

/** Draft-enabled collections: visitors see only published documents. */
export const draftContentAccess = { ...contentAccess, read: publishedOrLoggedIn };
