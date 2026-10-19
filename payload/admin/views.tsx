import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';
import type { ReactNode } from 'react';

import { userIsAdmin, userIsStaffOrAdmin } from '@/payload/access';

import Applications from './Applications';
import BillingRun from './BillingRun';
import RoomCalendar from './RoomCalendar';

/** A custom admin page (staff only): the admin's frame, a heading, the tool. */
function staffPage(title: string, tool: (props: AdminViewServerProps) => ReactNode) {
  return function StaffPage(props: AdminViewServerProps) {
    const { req, permissions, locale, visibleEntities } = props.initPageResult;
    if (!userIsStaffOrAdmin(req.user)) redirect('/admin/unauthorized');
    return (
      <DefaultTemplate
        i18n={req.i18n}
        locale={locale}
        params={props.params}
        payload={req.payload}
        permissions={permissions}
        searchParams={props.searchParams}
        user={req.user ?? undefined}
        visibleEntities={visibleEntities}
      >
        <Gutter>
          <h1 style={{ margin: '24px 0 16px' }}>{title}</h1>
          {tool(props)}
        </Gutter>
      </DefaultTemplate>
    );
  };
}

/** /admin/jelentkezesek: payments, admissions and reviews in one place. */
export const ApplicationsView = staffPage('Jelentkezések', () => <Applications />);

/** /admin/teremnaptar: the room calendar. */
export const RoomCalendarView = staffPage('Teremnaptár', ({ initPageResult }) => (
  <RoomCalendar isAdmin={userIsAdmin(initPageResult.req.user)} />
));

/** /admin/szamlazas: the monthly invoices — szakmai fees, kezdő instalments. */
export const BillingRunView = staffPage('Havi számlázás', () => <BillingRun />);
