import Image from 'next/image';
import Link from 'next/link';

import DetailsDialog from '@/components/DetailsDialog';
import Emph from '@/components/Emph';
import { CheckIcon, MailIcon, PersonIcon, PhoneIcon, PinIcon } from '@/components/icons';
import Lines from '@/components/Lines';
import QuoteRequestForm from '@/components/QuoteRequestForm';
import ReviewSlider from '@/components/ReviewSlider';
import { ArrowLink, ButtonLink, Eyebrow, SectionHeading } from '@/components/ui';
import { getContactPeople, getContactPerson, getInstructors, getReviews, getSiteSettings, getTeamBuildingProgrammes, getUi } from '@/lib/data';
import { formatPhone } from '@/lib/format';

import type { BlockProps } from './types';

/** "Hallgatóink mondták": the review notes slider. */
export async function Reviews({ block, className }: BlockProps<'reviews'>) {
  const reviews = await getReviews();
  const headingId = `${block.anchor ?? 'velemenyek'}-cim`;
  return (
    <section id={block.anchor} aria-labelledby={headingId} className={`mx-auto flex max-w-[1440px] flex-col gap-6 lg:gap-12 lg:px-20 ${className}`}>
      <div className="flex flex-col gap-3.5 px-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:px-0">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <h2 id={headingId} className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">
            <Emph text={block.heading} />
          </h2>
        </div>
        <p className="text-[15px] text-muted lg:max-w-[380px] lg:pb-2 lg:text-lg lg:leading-relaxed lg:text-ink2">{block.intro}</p>
      </div>
      <ReviewSlider reviews={reviews} />
    </section>
  );
}

/** The instructors' round portraits in a row, with a heading, text and a button. */
export async function InstructorRow({ block, className }: BlockProps<'instructorRow'>) {
  const instructors = await getInstructors();
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-8 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading
        eyebrow={block.eyebrow}
        heading={block.heading}
        aside={<p className="text-[15.5px] leading-relaxed text-ink2 lg:max-w-[440px] lg:text-lg">{block.text}</p>}
      />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-7">
        {instructors.map((ins) => (
          <li key={ins.id}>
            <Link href={block.link.href} className="group flex flex-col items-center gap-3 text-center">
              <Image
                src={ins.photo.src}
                alt=""
                width={160}
                height={160}
                className="aspect-square w-full max-w-[150px] rounded-full border-[3px] border-paper bg-sand object-cover shadow-[0_12px_24px_-16px_rgba(11,58,63,0.6)] transition-transform group-hover:scale-[1.03]"
              />
              <span className="font-semibold leading-tight">
                <span className="link-nav">{ins.name}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <ButtonLink link={block.link} variant="primary" arrow className="self-stretch sm:self-start" />
    </section>
  );
}

/** All instructors as cards; the full bio opens in a popup. */
export async function InstructorGrid({ block, className }: BlockProps<'instructorGrid'>) {
  const [ui, instructors] = await Promise.all([getUi(), getInstructors()]);
  return (
    <section id={block.anchor} className={`mx-auto grid max-w-[1440px] gap-5 px-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 lg:px-20 ${className}`}>
      {instructors.map((ins) => {
        const titleId = `oktato-${ins.id}`;
        const [first, ...rest] = ins.bio;
        return (
          <article key={ins.id} className="flex flex-col gap-5 rounded-3xl border border-line bg-paper p-6 lg:p-8">
            <Image
              src={ins.photo.src}
              alt={ins.photo.alt}
              width={ins.photo.width}
              height={ins.photo.height}
              sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
              className="aspect-square w-full rounded-2xl bg-sand object-cover"
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{ins.role}</span>
              <h2 className="font-display text-[34px] leading-none lg:text-[40px]">{ins.name}</h2>
            </div>
            <p className="line-clamp-5 text-[15.5px] leading-relaxed text-ink2">{first}</p>
            {rest.length > 0 || (first?.length ?? 0) > 300 ? (
              <DetailsDialog label={ui.common.readMore} titleId={titleId} buttonClassName="link mt-auto min-h-[44px] self-start font-bold text-teal">
                <div className="flex items-center gap-4 pr-12">
                  <Image src={ins.photo.src} alt="" width={80} height={80} className="h-20 w-20 shrink-0 rounded-full border-[3px] border-gold object-cover" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{ins.role}</span>
                    <h2 id={titleId} className="font-display text-[34px] leading-none lg:text-[40px]">
                      {ins.name}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-col gap-3.5 border-t border-line pt-5 text-[15.5px] leading-relaxed text-ink2 lg:text-[17px]">
                  {ins.bio.map((para, i) => (
                    <p key={i}>
                      <Lines text={para} />
                    </p>
                  ))}
                </div>
              </DetailsDialog>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

/** Dark card with the main contact person, phone, e-mail and address. */
export async function ContactCard({ block, className }: BlockProps<'contactCard'>) {
  const [ui, settings] = await Promise.all([getUi(), getSiteSettings()]);
  const person = await getContactPerson(settings.contact.primaryPersonId);
  return (
    <section id={block.anchor} className={`mx-3 lg:mx-auto lg:max-w-[1440px] lg:px-20 ${className}`}>
      <div className="on-dark relative grid items-center gap-6 overflow-hidden rounded-[26px] bg-deep px-6 py-10 text-cream lg:grid-cols-2 lg:gap-16 lg:rounded-[32px] lg:p-20">
        <div
          className="sun absolute -right-24 -top-24 h-52 w-52 rounded-full opacity-85 lg:-bottom-64 lg:-left-36 lg:right-auto lg:top-auto lg:h-[460px] lg:w-[460px]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 lg:gap-7 lg:pb-28">
          <Eyebrow dark>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[40px] leading-[1.02] lg:text-[72px] lg:leading-none">
            <Emph text={block.heading} dark />
          </h2>
          <ButtonLink link={block.cta} variant="gold" arrow className="hidden self-start lg:inline-flex" />
        </div>
        <div className="relative flex flex-col rounded-3xl lg:bg-deep2 lg:px-9 lg:py-3">
          <div className="flex items-center gap-4 border-b border-[#2b5a5e] pb-4 lg:gap-5 lg:py-6">
            {person.photo ? (
              <Image
                src={person.photo.src}
                alt={person.photo.alt}
                width={88}
                height={88}
                className="h-16 w-16 shrink-0 rounded-full border-[3px] border-gold object-cover lg:h-[88px] lg:w-[88px]"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-gold lg:h-[88px] lg:w-[88px]">
                <PersonIcon />
              </span>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#b9d2ce] lg:text-[13px]">{ui.contact.person}</span>
              <span className="text-lg font-semibold lg:text-[22px]">{person.name}</span>
            </div>
          </div>
          <a href={`tel:${person.phone}`} className="flex min-h-[52px] items-center gap-4 border-b border-[#2b5a5e] text-[17px] lg:py-5 lg:text-xl">
            <PhoneIcon colour="#f9c86a" />
            <span className="link-nav">{formatPhone(person.phone)}</span>
          </a>
          <a
            href={`mailto:${settings.contact.email}`}
            className="flex min-h-[52px] items-center gap-4 text-[15px] sm:text-[17px] lg:border-b lg:border-[#2b5a5e] lg:py-5 lg:text-xl"
          >
            <MailIcon colour="#f9c86a" />
            <span className="link-nav">{settings.contact.email}</span>
          </a>
          <div className="hidden items-center gap-4 py-5 text-xl lg:flex">
            <PinIcon colour="#f9c86a" />
            {settings.contact.address}
          </div>
        </div>
        <ButtonLink link={block.cta} variant="gold" arrow className="relative lg:hidden" />
      </div>
    </section>
  );
}

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

const CARD = 'flex flex-col gap-5 rounded-3xl border border-line bg-paper p-7 lg:p-9';
const AVATAR = 'h-24 w-24 shrink-0 rounded-full border-[3px] border-gold lg:h-28 lg:w-28';

/** Contact people (photo or initials, role, phone) + the e-mail card. */
export async function ContactPeople({ block, className }: BlockProps<'contactPeople'>) {
  const [people, settings] = await Promise.all([getContactPeople(), getSiteSettings()]);
  return (
    <section id={block.anchor} className={`mx-auto grid max-w-[1440px] gap-4 px-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:px-20 ${className}`}>
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
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{block.email.eyebrow}</span>
            <span className="font-display text-[32px] leading-none lg:text-[38px]">{block.email.heading}</span>
          </div>
        </div>
        <a href={`mailto:${settings.contact.email}`} className="flex min-h-[48px] items-center gap-3 border-t border-line pt-4 text-lg">
          <MailIcon colour="#b8472a" />
          <span className="link-nav break-all">{settings.contact.email}</span>
        </a>
      </div>
    </section>
  );
}

/** Address, a note and the directions link beside the map. */
export async function Location({ block, className }: BlockProps<'location'>) {
  const [ui, settings] = await Promise.all([getUi(), getSiteSettings()]);
  return (
    <section id={block.anchor} className={`mx-auto grid max-w-[1440px] gap-8 px-5 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-20 ${className}`}>
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">
            <Emph text={block.heading} />
          </h2>
        </div>
        <p className="flex items-start gap-3 text-lg lg:text-xl">
          <PinIcon colour="#b8472a" />
          <span>
            {block.addressLines.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </span>
        </p>
        <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{block.text}</p>
        <ArrowLink link={{ label: ui.contact.directions, href: settings.map.directionsUrl }} className="self-start" />
      </div>
      <iframe
        src={settings.map.embedUrl}
        title={settings.map.title}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="aspect-[4/3] w-full rounded-3xl border border-line bg-sand lg:aspect-auto lg:min-h-[440px]"
      />
    </section>
  );
}

/** The team-building programmes, numbered. */
export async function Programmes({ block, className }: BlockProps<'programmes'>) {
  const [ui, programmes] = await Promise.all([getUi(), getTeamBuildingProgrammes()]);
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
      <div className="flex flex-col border-b border-line">
        {programmes.map((programme, i) => (
          <article key={programme.id} className="grid gap-4 border-t border-line py-7 lg:grid-cols-[80px_5fr_7fr] lg:gap-10 lg:py-10">
            <span className="font-display text-[44px] leading-none text-rust lg:text-[64px]">{String(i + 1).padStart(2, '0')}</span>
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-[34px] leading-none lg:text-[44px]">{programme.name}</h3>
              <dl className="flex flex-col gap-2 text-[15px]">
                <div className="flex gap-2">
                  <dt className="text-muted">{ui.teamBuilding.duration}</dt>
                  <dd className="font-semibold">{programme.duration}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted">{ui.teamBuilding.venue}</dt>
                  <dd className="font-semibold">{programme.venue}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col gap-3 text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">
              {programme.description.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Heading, text, goals and a photo beside the quote request form. */
export async function QuoteRequest({ block, className }: BlockProps<'quoteRequest'>) {
  const settings = await getSiteSettings();
  return (
    <section id={block.anchor} className={`mx-auto grid max-w-[1440px] gap-8 px-5 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-20 ${className}`}>
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">
            <Emph text={block.heading} />
          </h2>
        </div>
        <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{block.text}</p>
        <ul className="flex flex-col border-b border-line">
          {block.goals.map((goal) => (
            <li key={goal} className="flex items-start gap-3 border-t border-line py-3.5">
              <span className="mt-0.5 text-teal">
                <CheckIcon />
              </span>
              <span className="leading-snug">{goal}</span>
            </li>
          ))}
        </ul>
        <Image
          src={block.image.src}
          alt={block.image.alt}
          width={block.image.width}
          height={block.image.height}
          sizes="40vw"
          className="hidden aspect-[4/3] w-full rounded-3xl bg-deep object-cover lg:block"
        />
      </div>
      <QuoteRequestForm recipient={settings.contact.email} />
    </section>
  );
}
