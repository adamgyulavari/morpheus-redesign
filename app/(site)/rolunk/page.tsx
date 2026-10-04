import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import Emph from '@/components/Emph';
import { ArrowRight } from '@/components/icons';
import SmartLink from '@/components/SmartLink';
import { ButtonLink, Eyebrow, HeroButtons, PageHero, SectionHeading } from '@/components/ui';
import { getInstructors, getPageContent } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('rolunk');
  return { title: meta.title, description: meta.description };
}

export default async function AboutPage() {
  const [{ hero, goal, name, mission, next, cta }, instructors] = await Promise.all([getPageContent('rolunk'), getInstructors()]);
  return (
    <>
      <PageHero heading={hero.heading} lead={hero.lead} image={hero.image} layout={{ size: 'md', tilt: -2.5, position: 'top', sun: 'top-right' }}>
        <HeroButtons primary={hero.primaryCta} secondary={hero.secondaryCta} />
      </PageHero>

      {/* GOAL */}
      <section className="mx-auto grid max-w-[1440px] gap-6 px-5 pt-16 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-20 lg:pt-[120px]">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{goal.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">
            <Emph text={goal.heading} />
          </h2>
        </div>
        <p className="text-[17px] leading-relaxed text-ink2 lg:pt-4 lg:text-xl lg:leading-[28px]">{goal.text}</p>
      </section>

      {/* THE NAME */}
      <section className="on-dark relative mt-16 overflow-hidden bg-deep text-cream lg:mt-[120px]">
        <div className="sun absolute -left-32 -top-32 h-72 w-72 rounded-full opacity-90 lg:-left-48 lg:-top-48 lg:h-[480px] lg:w-[480px]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-16 lg:grid lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-20 lg:py-28">
          <div className="hidden lg:block" aria-hidden="true" />
          <div className="flex flex-col gap-6 lg:gap-8">
            <Eyebrow dark>{name.eyebrow}</Eyebrow>
            <p className="font-display text-[40px] leading-[1.05] lg:text-[64px] lg:leading-none">
              <Emph text={name.heading} dark />
            </p>
            <p className="text-[17px] leading-relaxed text-mist lg:text-xl lg:leading-[28px]">{name.text}</p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 pt-16 lg:grid-cols-2 lg:gap-20 lg:px-20 lg:pt-[120px]">
        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-3.5 lg:gap-5">
            <Eyebrow>{mission.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">{mission.heading}</h2>
          </div>
          <p className="font-display text-[26px] italic leading-snug text-deep lg:text-[32px]">{mission.quote}</p>
          {mission.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">
              {p}
            </p>
          ))}
        </div>
        <Image
          src={mission.image.src}
          alt={mission.image.alt}
          width={mission.image.width}
          height={mission.image.height}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/3] w-full rounded-[22px] bg-deep object-cover lg:rounded-3xl"
        />
      </section>

      {/* WHERE NEXT */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
        <SectionHeading eyebrow={next.eyebrow} heading={next.heading} />
        <div className="grid gap-5 md:grid-cols-3">
          {next.cards.map((card) => (
            <SmartLink
              key={card.href}
              href={card.href}
              className="group flex flex-col gap-3 rounded-3xl border border-line bg-paper p-7 transition-colors hover:border-teal lg:p-9"
            >
              <Eyebrow>{card.eyebrow}</Eyebrow>
              <span className="font-display text-[34px] leading-none lg:text-[40px]">
                <span className="link-nav">{card.title}</span>
              </span>
              <span className="leading-relaxed text-ink2">{card.text}</span>
              <span className="mt-auto pt-2 text-teal transition-transform group-hover:translate-x-1">
                <ArrowRight />
              </span>
            </SmartLink>
          ))}
        </div>
      </section>

      {/* INSTRUCTORS */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 pb-16 pt-16 lg:gap-12 lg:px-20 lg:pb-[120px] lg:pt-[120px]">
        <SectionHeading eyebrow={cta.eyebrow} heading={cta.heading} aside={<p className="text-[15.5px] leading-relaxed text-ink2 lg:max-w-[440px] lg:text-lg">{cta.text}</p>} />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-7">
          {instructors.map((ins) => (
            <li key={ins.id}>
              <Link href={cta.primary.href} className="group flex flex-col items-center gap-3 text-center">
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
        <ButtonLink link={cta.primary} variant="primary" arrow className="self-stretch sm:self-start" />
      </section>
    </>
  );
}
