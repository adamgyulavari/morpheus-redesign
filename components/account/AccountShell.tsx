import type { ReactNode } from 'react';

import Emph from '@/components/Emph';
import SiteLayout from '@/components/layouts/SiteLayout';
import { UiProvider } from '@/components/UiStrings';
import { Eyebrow } from '@/components/ui';
import { getUi } from '@/lib/data';
import { uiTab } from '@/payload/ui-catalogue';

/**
 * The frame of the account and checkout pages: site header and footer, a heading and a narrow
 * column; their texts (Fiók és fizetés) for the forms in it.
 */
export default async function AccountShell({
  eyebrow,
  heading,
  intro,
  wide = false,
  children,
}: {
  eyebrow: string;
  /** `*…*` marks the highlighted part, as in the CMS headings. */
  heading: string;
  intro?: ReactNode;
  /** The /fiokom pages use the site's full width (as the header and footer). */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <SiteLayout>
      <section
        className={`mx-auto flex flex-col gap-8 px-5 pb-16 pt-10 lg:gap-10 lg:px-20 lg:pb-[120px] lg:pt-20 ${wide ? 'max-w-[1440px]' : 'max-w-[680px]'}`}
      >
        <div className="flex flex-col gap-4 lg:gap-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-balance font-display text-[48px] leading-[0.98] lg:text-[72px]">
            <Emph text={heading} />
          </h1>
          {intro && <div className="max-w-[560px] text-[17px] leading-relaxed text-ink2">{intro}</div>}
        </div>
        <UiProvider ui={uiTab(await getUi(), 'account')}>{children}</UiProvider>
      </section>
    </SiteLayout>
  );
}
