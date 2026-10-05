import type { ReactNode } from 'react';

import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

/** The regular page frame: header, main, footer. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
