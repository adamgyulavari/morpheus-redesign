import type { ReactNode } from 'react';

import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

/** Layout of the regular site pages: header, main, footer. (The /bio page has its own.) */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
