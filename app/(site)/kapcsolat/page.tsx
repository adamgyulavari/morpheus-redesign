import type { Metadata } from 'next';
import Image from 'next/image';

import { MailIcon, PhoneIcon, PinIcon } from '@/components/icons';
import { ArrowLink, ButtonLink, Eyebrow, PageHero } from '@/components/ui';
import { getContactPeople, getPageContent, getSiteSettings } from '@/lib/data';
import { formatPhone } from '@/lib/format';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('kapcsolat');
  return { title: meta.title, description: meta.description };
}

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

const CARD = 'flex flex-col gap-5 rounded-3xl border border-line bg-paper p-7 lg:p-9';
const AVATAR = 'h-24 w-24 shrink-0 rounded-full border-[3px] border-gold lg:h-28 lg:w-28';

export default async function ContactPage() {
  const [{ hero, email, location, social }, people, settings] = await Promise.all([
    getPageContent('kapcsolat'),
    getContactPeople(),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHero heading={hero.heading} lead={hero.lead} image={hero.image} layout={{ size: 'sm', tilt: -2, position: 'top', sun: 'top-left' }} />

      {/* PEOPLE + E-MAIL */}
      <section className="mx-auto grid max-w-[1440px] gap-4 px-5 pt-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:px-20 lg:pt-16">
        {people.map((person) => (
          <div key={person.id} className={CARD}>
            <div className="flex items-center gap-5">
              {person.photo ? (
                <Image src={person.photo.src} alt={person.photo.alt} width={112} height={112} className={`${AVATAR} object-cover`} />
              ) : (
                <span className={`${AVATAR} flex items-center justify-center bg-teal font-display text-4xl text-cream`} aria-hidden="true">
                  {initials(person.name)}
                </span>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{person.role}</span>
                <span className="font-display text-[32px] leading-none lg:text-[38px]">{person.name}</span>
              </div>
            </div>
            <a href={`tel:${person.phone}`} className="flex min-h-[48px] items-center gap-3 border-t border-line pt-4 text-lg">
              <PhoneIcon colour="#b8472a" />
              <span className="link-nav">{formatPhone(person.phone)}</span>
            </a>
          </div>
        ))}
        <div className={`${CARD} md:col-span-2 lg:col-span-1`}>
          <div className="flex items-center gap-5">
            <span className={`${AVATAR} flex items-center justify-center bg-sand text-rust-dark`} aria-hidden="true">
              <MailIcon colour="currentColor" className="h-9 w-9" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{email.eyebrow}</span>
              <span className="font-display text-[32px] leading-none lg:text-[38px]">{email.heading}</span>
            </div>
          </div>
          <a href={`mailto:${settings.contact.email}`} className="flex min-h-[48px] items-center gap-3 border-t border-line pt-4 text-lg">
            <MailIcon colour="#b8472a" />
            <span className="link-nav break-all">{settings.contact.email}</span>
          </a>
        </div>
      </section>

      {/* LOCATION */}
      <section className="mx-auto grid max-w-[1440px] gap-8 px-5 pt-16 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-20 lg:pt-[120px]">
        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-3.5 lg:gap-5">
            <Eyebrow>{location.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">{location.heading}</h2>
          </div>
          <p className="flex items-start gap-3 text-lg lg:text-xl">
            <PinIcon colour="#b8472a" />
            <span>
              {location.addressLines.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </span>
          </p>
          <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{location.text}</p>
          <ArrowLink link={{ label: location.directionsLabel, href: settings.map.directionsUrl }} className="self-start" />
        </div>
        <iframe
          src={settings.map.embedUrl}
          title={settings.map.title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="aspect-[4/3] w-full rounded-3xl border border-line bg-sand lg:aspect-auto lg:min-h-[440px]"
        />
      </section>

      {/* SOCIAL */}
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-16 lg:px-20 lg:pb-[120px] lg:pt-[120px]">
        <div className="flex flex-col gap-4 border-y border-line py-8 sm:flex-row sm:items-center sm:justify-between lg:py-10">
          <p className="font-display text-[30px] leading-tight lg:text-[40px]">{social.heading}</p>
          <ButtonLink link={{ label: social.label, href: settings.social.facebook }} variant="outline" arrow className="self-start sm:self-auto" />
        </div>
      </section>
    </>
  );
}
