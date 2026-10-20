import type { BeforeListTableServerProps } from 'payload';

import { userIsStaffOrAdmin } from '@/payload/access';

import { GroupImportForm } from './GroupImportForm';

/** Above the Csoportok list: "Importálás fájlból" (staff), with the rooms for the weekly slot. */
export async function GroupImport({ payload, user }: BeforeListTableServerProps) {
  if (!userIsStaffOrAdmin(user)) return null;
  const { docs } = await payload.find({ collection: 'rooms', depth: 0, limit: 0, pagination: false, sort: 'name' });
  return <GroupImportForm rooms={docs.map((r) => ({ id: r.id, name: r.name }))} />;
}
