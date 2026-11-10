import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';
import type { ReactNode } from 'react';

import { userIsAdmin, userIsStaffOrAdmin } from '@/payload/access';

import Applications from './Applications';
import BillingRun from './BillingRun';
import RoomCalendar from './RoomCalendar';
import ShowTickets from './ShowTickets';

/**
 * A custom admin page (staff only): the admin's frame, a heading, the tool. The header's actions
 * (← Weboldal) are passed on: Payload's own pages get them from the config, a custom template not.
 */
function staffPage(
  title: string | ((props: AdminViewServerProps) => Promise<string>),
  tool: (props: AdminViewServerProps) => ReactNode,
) {
  return async function StaffPage(props: AdminViewServerProps) {
    const { req, permissions, locale, visibleEntities } = props.initPageResult;
    if (!userIsStaffOrAdmin(req.user)) redirect('/admin/unauthorized');
    const heading = typeof title === 'string' ? title : await title(props);
    return (
      <DefaultTemplate
        i18n={req.i18n}
        locale={locale}
        params={props.params}
        payload={req.payload}
        permissions={permissions}
        searchParams={props.searchParams}
        user={req.user ?? undefined}
        viewActions={req.payload.config.admin.components?.actions}
        visibleEntities={visibleEntities}
      >
        <Gutter>
          <h1 style={{ margin: '24px 0 16px' }}>{heading}</h1>
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

/** /admin/jegyek/<show id> (path: /jegyek/:show): the show's id, from the path. */
const showIdOf = (props: AdminViewServerProps) => Number((props.params?.segments as string[] | undefined)?.[1]);

/** /admin/jegyek/<show id>: a show's tickets (the door list) and Tiszteletjegy. */
export const ShowTicketsView = staffPage(
  async (props) => {
    const show = await props.initPageResult.req.payload
      .findByID({ collection: 'shows', id: showIdOf(props), depth: 1, disableErrors: true })
      .catch(() => null);
    const production = typeof show?.production === 'object' ? show.production : null;
    return `Jegyek — ${production?.title ?? 'előadás'}`;
  },
  (props) => <ShowTickets showId={showIdOf(props)} />,
);
