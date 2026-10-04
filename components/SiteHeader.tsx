import Link from 'next/link';

import { getSiteSettings } from '@/lib/data';

import Logo from './Logo';
import MobileMenu from './MobileMenu';
import NavLink from './NavLink';

export default async function SiteHeader() {
  const { nav, headerCta } = await getSiteSettings();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="relative mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:h-24 lg:px-20">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-11 w-11 lg:h-16 lg:w-16" />
          <span className="flex flex-col gap-1 lg:gap-1.5">
            <span className="font-display text-2xl leading-none lg:text-[34px]">Morpheus</span>
            <span className="text-[10px] font-bold uppercase leading-none tracking-[0.3em] text-teal lg:text-xs lg:leading-[16px]">Színműhely</span>
          </span>
        </Link>
        <div className="hidden items-center gap-12 xl:flex">
          <nav aria-label="Főmenü" className="flex items-center gap-8 whitespace-nowrap text-[17px] font-medium">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href} match={item.match} className="link-nav">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link href={headerCta.href} className="btn btn-md btn-primary">
            {headerCta.label}
          </Link>
        </div>
        <MobileMenu nav={nav} cta={headerCta} />
      </div>
    </header>
  );
}
