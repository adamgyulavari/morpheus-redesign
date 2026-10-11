import type { ReactNode } from 'react';

import Emph from '@/components/Emph';
import SiteLayout from '@/components/layouts/SiteLayout';
import { Eyebrow } from '@/components/ui';

/** The frame of the account pages: site header and footer, a heading and a narrow column. */
export default function AccountShell({
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
  /** The account page uses a wider column. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <SiteLayout>
      <section className={`mx-auto flex flex-col gap-8 px-5 pb-16 pt-10 lg:gap-10 lg:px-20 lg:pb-[120px] lg:pt-20 ${wide ? 'max-w-[1120px]' : 'max-w-[680px]'}`}>
        <div className="flex flex-col gap-4 lg:gap-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-balance font-display text-[48px] leading-[0.98] lg:text-[72px]">
            <Emph text={heading} />
          </h1>
          {intro && <div className="max-w-[560px] text-[17px] leading-relaxed text-ink2">{intro}</div>}
        </div>
        {children}
      </section>
    </SiteLayout>
  );
}

/** The paper card the forms sit in. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-4 rounded-3xl border border-line bg-paper p-6 lg:gap-5 lg:p-10 ${className}`}>{children}</div>;
}
