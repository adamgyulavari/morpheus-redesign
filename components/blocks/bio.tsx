import { ArrowRight, MailIcon, PhoneIcon } from '@/components/icons';
import Logo from '@/components/Logo';
import SmartLink from '@/components/SmartLink';
import SocialLinks from '@/components/SocialLinks';
import { getContactPerson, getSiteSettings, getUi, getUpcomingShows } from '@/lib/data';
import { showDateLine } from '@/lib/dates';
import { formatPhone } from '@/lib/format';

import type { BlockProps } from './types';

// Blocks of the link-in-bio page (minimal layout: a narrow centred column).

/** Logo, name and tagline. */
export async function BioIntro({ block, className }: BlockProps<'bioIntro'>) {
  const settings = await getSiteSettings();
  return (
    <header id={block.anchor} className={`relative flex flex-col items-center gap-3 text-center ${className}`}>
      <Logo className="h-24 w-24" />
      <h1 className="font-display text-[38px] leading-none">{settings.name}</h1>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">{settings.tagline}</p>
    </header>
  );
}

/** The next show with its ticket/registration button. */
export async function BioNextShow({ block, className }: BlockProps<'bioNextShow'>) {
  const [ui, [next]] = await Promise.all([getUi(), getUpcomingShows(1)]);
  if (!next) return null;
  const action = next.ticketUrl
    ? { label: ui.shows.ticket, href: next.ticketUrl }
    : next.registrationUrl
      ? { label: ui.shows.registration, href: next.registrationUrl }
      : undefined;
  return (
    <section
      id={block.anchor}
      aria-label={ui.shows.nextShow}
      className={`on-dark relative flex w-full flex-col gap-3 rounded-[22px] bg-deep p-5 text-cream ${className}`}
    >
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{ui.shows.nextShow}</span>
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
  );
}

/** Full-width link buttons; the first one is filled. */
export async function LinkList({ block, className }: BlockProps<'linkList'>) {
  const ui = await getUi();
  return (
    <nav id={block.anchor} aria-label={ui.common.links} className={`relative flex w-full flex-col gap-3 ${className}`}>
      {block.links.map((link, i) => (
        <SmartLink key={link.href} href={link.href} className={`btn min-h-[56px] w-full text-[17px] ${i === 0 ? 'btn-primary' : 'btn-outline bg-paper'}`}>
          {link.label}
        </SmartLink>
      ))}
    </nav>
  );
}

/** Facebook + Instagram icons. */
export async function SocialLinksBlock({ className }: BlockProps<'socialLinks'>) {
  const settings = await getSiteSettings();
  return <SocialLinks {...settings.social} className={`relative text-teal ${className}`} />;
}

/** E-mail, phone and the privacy link at the bottom of the page. */
export async function ContactFooter({ block, className }: BlockProps<'contactFooter'>) {
  const settings = await getSiteSettings();
  const person = await getContactPerson(settings.contact.primaryPersonId);
  return (
    <footer id={block.anchor} className={`relative mt-auto flex flex-col items-center gap-2 text-center text-sm text-ink2 ${className}`}>
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
  );
}
