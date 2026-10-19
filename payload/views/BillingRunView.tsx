import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';

import AdminBillingRun from '@/components/billing/AdminBillingRun';
import { userIsStaffOrAdmin } from '@/payload/access';

/** /admin/szamlazas: the monthly invoices — szakmai fees, kezdő instalments (staff only). */
export function BillingRunView({ initPageResult, params, searchParams }: AdminViewServerProps) {
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
        <h1 style={{ margin: '24px 0 16px' }}>Havi számlázás</h1>
        <AdminBillingRun />
      </Gutter>
    </DefaultTemplate>
  );
}
