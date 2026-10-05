import { getSiteSettings } from '@/lib/data';

import Logo from './Logo';
import SmartLink from './SmartLink';
import SocialLinks from './SocialLinks';

export default async function SiteFooter() {
  const { name, tagline, copyright, footerColumns, privacy, social } = await getSiteSettings();
  return (
    <footer className="on-dark bg-night text-mist">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-5 pb-8 pt-12 lg:gap-14 lg:px-20 lg:pb-12 lg:pt-[72px]">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div className="flex items-start gap-3.5">
            <Logo className="h-14 w-14 shrink-0 lg:h-16 lg:w-16" />
            <div className="flex flex-col gap-2 pt-1.5">
              <span className="font-display text-[26px] leading-none text-cream lg:text-[30px]">{name}</span>
              <span className="text-[15px]">{tagline}</span>
            </div>
          </div>
          {footerColumns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3 text-[15px]">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{col.title}</span>
              {col.links.map((link) => (
                <SmartLink key={link.label} href={link.href} className="link-nav self-start">
                  {link.label}
                </SmartLink>
              ))}
              {col.social && <SocialLinks {...social} className="mt-1 text-mist" />}
            </nav>
          ))}
        </div>
        <div className="flex flex-col gap-2.5 border-t border-[#1d3d40] pt-7 text-sm sm:flex-row sm:justify-between">
          <span>{copyright}</span>
          <SmartLink href={privacy.href} className="link self-start">
            {privacy.label}
          </SmartLink>
        </div>
      </div>
    </footer>
  );
}
