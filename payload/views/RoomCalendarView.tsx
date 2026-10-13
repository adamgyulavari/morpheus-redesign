import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';

import AdminRoomCalendar from '@/components/rooms/AdminRoomCalendar';
import { userIsAdmin, userIsStaffOrAdmin } from '@/payload/access';

/** /admin/teremnaptar: the room calendar in the admin frame (staff only). */
export function RoomCalendarView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult;
  if (!userIsStaffOrAdmin(req.user)) redirect('/admin/unauthorized');
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <h1 style={{ margin: '24px 0 16px' }}>Teremnaptár</h1>
        <AdminRoomCalendar isAdmin={userIsAdmin(req.user)} />
      </Gutter>
    </DefaultTemplate>
  );
}
