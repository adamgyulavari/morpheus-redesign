import type { UIFieldServerProps } from 'payload';

import { userIsAdmin } from '@/payload/access';

import { MergeUserForm } from './MergeUserForm';

/** On an account (admin): „Fiók összevonása” — another account of the same person is merged into this one. Admins only. */
export async function MergeUser({ id, payload, req }: UIFieldServerProps) {
  if (!id || !userIsAdmin(req.user)) return null;
  const user = await payload.findByID({ collection: 'users', id, depth: 0, disableErrors: true });
  if (!user) return null;
  return <MergeUserForm userId={user.id} email={user.email} />;
}
