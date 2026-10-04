import type { Metadata } from 'next';
import Image from 'next/image';

import Emph from '@/components/Emph';
import { ArrowRight, MailIcon, PersonIcon, PhoneIcon, PinIcon } from '@/components/icons';
import Logo from '@/components/Logo';
import OfferingCard from '@/components/OfferingCard';
import ReviewsSection from '@/components/ReviewsSection';
import ShowDetails from '@/components/ShowDetails';
import ShowRow from '@/components/ShowRow';
import SmartLink from '@/components/SmartLink';
import { ArrowLink, ButtonLink, Eyebrow, PlaceholderAvatar } from '@/components/ui';
import VideoEmbed from '@/components/VideoEmbed';
import { getContactPerson, getCourses, getInstructors, getPageContent, getSiteSettings, getUpcomingShows } from '@/lib/data';
import { showDateLine } from '@/lib/dates';
import { formatPhone, priceSummary } from '@/lib/format';

// Static page, regenerated at most once a day (ISR) so past shows drop off without a redeploy.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('home');
  return { title: meta.title, description: meta.description };
}

export default async function HomePage() {
  const [page, settings, shows, courses, instructors] = await Promise.all([
    getPageContent('home'),
    getSiteSettings(),
    getUpcomingShows(),
    getCourses(),
    getInstructors(),
  ]);
  const person = await getContactPerson(settings.contact.primaryPersonId);
  const nextShow = shows[0];
  const { hero, questions, offerings, mood, contact } = page;

  // Course cards come from the course records (so facts and prices stay in one place).
  const cards = offerings.cards.map((card) => {
    if (!('courseId' in card)) return card;
    const course = courses.find((c) => c.id === card.courseId);
    if (!course) throw new Error(`Unknown course "${card.courseId}"`);
    return {
      badge: course.card.badge,
      title: course.title,
      text: course.card.text,
      facts: [...course.card.facts, { label: 'Díj', value: priceSummary(course.prices) }],
      cta: { label: course.card.ctaLabel, href: course.url },
    };
  });

  // Instructor avatars: real photos once instructors exist, the four placeholders until then.
  const avatars = instructors.filter((i) => i.photo).slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-12 pt-9 lg:grid-cols-2 lg:gap-12 lg:px-20 lg:pb-16 lg:pt-[72px]">
        <div className="order-2 flex flex-col gap-6 lg:order-1 lg:gap-8">
          <div className="flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-teal lg:justify-start lg:gap-3.5 lg:text-[13px]">
            {hero.keywords.map((word, i) => (
              <span key={word} className="contents">
                {i > 0 && (
                  <span className={`h-1.5 w-1.5 rounded-full lg:h-2 lg:w-2 ${i === 1 ? 'bg-[#f39a3d]' : 'bg-[#e0603a]'}`} aria-hidden="true" />
                )}
                <span>{word}</span>
              </span>
            ))}
          </div>
          <h1 className="text-balance text-center font-display text-[54px] leading-[0.98] lg:text-left lg:text-[108px] lg:leading-[0.95]">
            <Emph text={hero.heading} />
          </h1>
          <p className="text-center text-[17px] leading-relaxed text-ink2 lg:max-w-[540px] lg:text-left lg:text-xl lg:leading-[28px]">{hero.lead}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start lg:gap-4">
            <ButtonLink link={hero.primaryCta} variant="primary" arrow />
            <ButtonLink link={hero.secondaryCta} variant="outline" />
          </div>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="relative mx-auto aspect-square w-full max-w-[340px] lg:max-w-[560px]">
            <div className="pulse-ring" aria-hidden="true" />
            <div className="pulse-ring" aria-hidden="true" />
            <div className="pulse-ring" aria-hidden="true" />
            <Logo animated className="absolute inset-[16%] h-[68%] w-[68%]" />
            <Image
              src={hero.imageLarge.src}
              alt={hero.imageLarge.alt}
              width={hero.imageLarge.width}
              height={hero.imageLarge.height}
              priority
              sizes="(min-width: 1024px) 215px, 130px"
              className="absolute -right-[2%] -top-[6%] h-[38%] w-[38%] rounded-full border-[6px] border-paper object-cover shadow-[0_22px_44px_-20px_rgba(11,58,63,0.5)] lg:border-8"
            />
            <Image
              src={hero.imageSmall.src}
              alt={hero.imageSmall.alt}
              width={hero.imageSmall.width}
              height={hero.imageSmall.height}
              priority
              sizes="(min-width: 1024px) 165px, 100px"
              className="absolute bottom-[6%] right-[4%] h-[29%] w-[29%] rounded-full border-[5px] border-paper object-cover shadow-[0_22px_44px_-20px_rgba(11,58,63,0.5)] lg:border-[7px]"
            />
          </div>
          {nextShow && (
            <SmartLink
              href={`${settings.urls.upcomingShows}#eloadas-${nextShow.id}`}
              className="mt-6 flex flex-col gap-1.5 rounded-[18px] border border-line bg-paper px-5 py-4 shadow-[0_18px_40px_-18px_rgba(11,58,63,0.35)] transition-colors hover:border-teal lg:absolute lg:bottom-5 lg:left-0 lg:mt-0 lg:w-[272px] lg:px-[22px] lg:py-5"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-rust-dark lg:text-xs">{hero.nextShowLabel}</span>
              <span className="font-display text-[28px] leading-tight lg:text-[32px]">{nextShow.production.title}</span>
              <span className="text-sm text-ink2 lg:text-[15px]">{showDateLine(nextShow.date, nextShow.time)}</span>
              <span className="text-sm text-muted">
                {nextShow.production.byline} · {nextShow.venue.shortName}
              </span>
            </SmartLink>
          )}
        </div>
      </section>

      {/* QUESTIONS */}
      <section className="on-dark relative mt-6 overflow-hidden bg-deep text-cream lg:mt-12">
        <div className="sun absolute -right-28 -top-32 h-64 w-64 rounded-full opacity-90 lg:-right-44 lg:-top-56 lg:h-[520px] lg:w-[520px]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1440px] flex-col gap-9 px-5 py-16 lg:gap-16 lg:px-20 lg:py-28">
          <div className="flex max-w-[760px] flex-col gap-4 pr-14 lg:gap-5 lg:pr-0">
            <Eyebrow dark>{questions.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">
              <Emph text={questions.heading} dark />
            </h2>
          </div>
          <div className="grid gap-7 lg:grid-cols-2 lg:gap-x-20 lg:gap-y-14">
            {questions.items.map((item, i) => (
              <div key={item.title} className="flex gap-5 border-t border-[#2b5a5e] pt-6 lg:gap-7 lg:pt-8">
                <span className="font-display text-[32px] leading-none text-gold lg:text-[44px]">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex flex-col gap-2 lg:gap-3">
                  <h3 className="text-xl font-semibold leading-tight lg:text-[26px]">{item.title}</h3>
                  <p className="text-base leading-relaxed text-mist lg:text-lg lg:leading-[28px]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-5 rounded-[20px] bg-deep2 px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:rounded-3xl lg:px-12 lg:py-10">
            <span className="font-display text-4xl leading-tight lg:text-[52px] lg:leading-none">
              <Emph text={questions.closing} dark />
            </span>
            <ButtonLink link={questions.cta} variant="gold" arrow />
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-16 lg:gap-14 lg:px-20 lg:py-[120px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="flex flex-col gap-3.5 lg:gap-5">
            <Eyebrow>{offerings.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">{offerings.heading}</h2>
          </div>
          <SmartLink href={offerings.instructorsLink.href} className="flex items-center gap-4 text-teal lg:pb-1.5">
            <span className="flex">
              {avatars.length > 0
                ? avatars.map((a, i) =>
                    a.photo ? (
                      <Image
                        key={a.id}
                        src={a.photo.src}
                        alt=""
                        width={52}
                        height={52}
                        className={`h-[52px] w-[52px] rounded-full border-[3px] border-cream object-cover ${i > 0 ? '-ml-3.5' : ''}`}
                      />
                    ) : null,
                  )
                : [0, 1, 2, 3].map((i) => (
                    <PlaceholderAvatar key={i} className={`h-[52px] w-[52px] border-[3px] border-cream ${i > 0 ? '-ml-3.5' : ''}`} />
                  ))}
            </span>
            <span className="link link-arrow text-base lg:whitespace-nowrap lg:text-[17px]">
              {offerings.instructorsLink.label}
              <ArrowRight />
            </span>
          </SmartLink>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <OfferingCard key={card.title} {...card} highlighted={i === 0} />
          ))}
        </div>
      </section>

      {/* MOOD / VIDEO */}
      <section className="bg-sand">
        <div className="mx-auto grid max-w-[1440px] items-center gap-6 px-5 py-16 lg:grid-cols-[5fr_7fr] lg:gap-[72px] lg:px-20 lg:py-[120px]">
          <div className="flex flex-col gap-5 lg:gap-7">
            <Eyebrow>{mood.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">{mood.heading}</h2>
            <p className="hidden text-[19px] leading-relaxed text-ink2 lg:block">{mood.text}</p>
            <ArrowLink link={mood.facebookLink} className="hidden lg:inline-flex" />
          </div>
          <VideoEmbed youtubeId={settings.video.youtubeId} title={settings.video.title} />
          <ArrowLink link={mood.facebookLink} className="lg:hidden" />
        </div>
      </section>

      <ReviewsSection {...page.reviews} />

      {/* UPCOMING SHOWS */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-16 lg:gap-12 lg:px-20 lg:py-[120px]">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3.5 lg:gap-5">
            <Eyebrow>{page.shows.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">{page.shows.heading}</h2>
          </div>
          <ArrowLink link={page.shows.upcomingLink} className="hidden lg:inline-flex" />
        </div>
        {shows.length > 0 ? (
          <div className="flex flex-col">
            {shows.map((show, i) => (
              <ShowRow
                key={show.id}
                show={show}
                ticketLabel={page.shows.ticketLabel}
                registrationLabel={page.shows.registrationLabel}
                last={i === shows.length - 1}
                details={
                  <ShowDetails
                    show={show}
                    labels={{
                      ticket: page.shows.ticketLabel,
                      registration: page.shows.registrationLabel,
                      about: page.shows.aboutLabel,
                      info: page.shows.infoLabel,
                    }}
                  />
                }
              />
            ))}
          </div>
        ) : (
          <p className="border-y border-line py-8 text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[28px]">{page.shows.empty}</p>
        )}
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-8">
          <ArrowLink link={page.shows.upcomingLink} className="self-start lg:hidden" />
          <ArrowLink link={page.shows.allLink} className="self-start" />
        </div>
      </section>

      {/* CONTACT CARD */}
      <section className="mx-3 lg:mx-auto lg:max-w-[1440px] lg:px-20">
        <div className="on-dark relative grid items-center gap-6 overflow-hidden rounded-[26px] bg-deep px-6 py-10 text-cream lg:grid-cols-2 lg:gap-16 lg:rounded-[32px] lg:p-20">
          <div
            className="sun absolute -right-24 -top-24 h-52 w-52 rounded-full opacity-85 lg:-bottom-64 lg:-left-36 lg:right-auto lg:top-auto lg:h-[460px] lg:w-[460px]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 lg:gap-7 lg:pb-28">
            <Eyebrow dark>{contact.eyebrow}</Eyebrow>
            <h2 className="font-display text-[40px] leading-[1.02] lg:text-[72px] lg:leading-none">{contact.heading}</h2>
            <ButtonLink link={contact.cta} variant="gold" arrow className="hidden self-start lg:inline-flex" />
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
                <span className="text-xs font-semibold text-[#b9d2ce] lg:text-[13px]">{contact.personLabel}</span>
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
          <ButtonLink link={contact.cta} variant="gold" arrow className="relative lg:hidden" />
        </div>
      </section>

      {/* FULL-WIDTH PHOTO (sits directly on the footer) */}
      <figure className="relative mt-16 lg:mt-[120px]">
        <Image
          src={page.bottomImage.src}
          alt={page.bottomImage.alt}
          width={page.bottomImage.width}
          height={page.bottomImage.height}
          sizes="100vw"
          className="h-[320px] w-full object-cover lg:h-[640px]"
        />
      </figure>
    </>
  );
}
