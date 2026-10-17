import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';

import AdminApplications from '@/components/applications/AdminApplications';
import { userIsStaffOrAdmin } from '@/payload/access';

/** /admin/jelentkezesek: payments, admissions and reviews in one place (staff only). */
export function ApplicationsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
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
        <h1 style={{ margin: '24px 0 16px' }}>Jelentkezések</h1>
        <AdminApplications />
      </Gutter>
    </DefaultTemplate>
  );
}
