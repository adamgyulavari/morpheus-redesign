import type { Payload } from 'payload';

import { todayInBudapest } from '@/lib/dates';

/**
 * An active student is in at least one course group whose last day hasn't passed (Budapest).
 * The student area and room booking (later phases) are for active students only.
 */
export async function isActiveStudent(payload: Payload, user: { id: number | string } | null | undefined): Promise<boolean> {
  if (!user) return false;
  const { totalDocs } = await payload.count({
    collection: 'courseGroups',
    where: { and: [{ students: { in: [user.id] } }, { endDate: { greater_than_equal: `${todayInBudapest()}T00:00:00.000Z` } }] },
  });
  return totalDocs > 0;
}
