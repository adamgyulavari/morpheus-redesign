import type { Metadata } from 'next';

import { ArrowRight, MailIcon, PhoneIcon } from '@/components/icons';
import Logo from '@/components/Logo';
import SmartLink from '@/components/SmartLink';
import SocialLinks from '@/components/SocialLinks';
import { getContactPerson, getPageContent, getSiteSettings, getUpcomingShows } from '@/lib/data';
import { showDateLine } from '@/lib/dates';
import { formatPhone } from '@/lib/format';

// Regenerated daily so the "next show" card follows the show dates.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('bio');
  return { title: meta.title, description: meta.description };
}

/** Link-in-bio page for Instagram/Facebook: standalone, mobile-first, no site header. */
export default async function BioPage() {
  const [page, settings, [next]] = await Promise.all([getPageContent('bio'), getSiteSettings(), getUpcomingShows(1)]);
  const person = await getContactPerson(settings.contact.primaryPersonId);
  const action = next && (next.ticketUrl ? { label: 'Jegyek', href: next.ticketUrl } : next.registrationUrl ? { label: 'Regisztráció', href: next.registrationUrl } : undefined);

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col items-center gap-7 overflow-hidden px-5 pb-10 pt-12">
      <div className="sun absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-90" aria-hidden="true" />
      <header className="relative flex flex-col items-center gap-3 text-center">
        <Logo className="h-24 w-24" />
        <h1 className="font-display text-[38px] leading-none">{settings.name}</h1>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">{settings.tagline}</p>
      </header>

      {next && (
        <section aria-label={page.nextShowLabel} className="on-dark relative flex w-full flex-col gap-3 rounded-[22px] bg-deep p-5 text-cream">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{page.nextShowLabel}</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[30px] leading-tight">{next.production.title}</span>
            <span className="font-semibold">{showDateLine(next.date, next.time)}</span>
            <span className="text-sm text-mist">{next.venue.name}</span>
          </div>
          {action && (
            <a href={action.href} className="btn btn-md btn-gold self-start">
              {action.label}
              <ArrowRight />
            </a>
          )}
        </section>
      )}

      <nav aria-label="Linkek" className="relative flex w-full flex-col gap-3">
        {settings.bioLinks.map((link, i) => (
          <SmartLink key={link.href} href={link.href} className={`btn min-h-[56px] w-full text-[17px] ${i === 0 ? 'btn-primary' : 'btn-outline bg-paper'}`}>
            {link.label}
          </SmartLink>
        ))}
      </nav>

      <SocialLinks {...settings.social} className="relative text-teal" />

      <footer className="relative mt-auto flex flex-col items-center gap-2 text-center text-sm text-ink2">
        <a href={`mailto:${settings.contact.email}`} className="flex min-h-[44px] items-center gap-2">
          <MailIcon colour="#b8472a" className="h-[18px] w-[18px]" />
          <span className="link-nav">{settings.contact.email}</span>
        </a>
        <a href={`tel:${person.phone}`} className="flex min-h-[44px] items-center gap-2">
          <PhoneIcon colour="#b8472a" className="h-[18px] w-[18px]" />
          <span className="link-nav">{formatPhone(person.phone)}</span>
        </a>
        <SmartLink href={settings.privacy.href} className="link mt-2 text-muted">
          {settings.privacy.label}
        </SmartLink>
      </footer>
    </main>
  );
}
