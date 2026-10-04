import Image from 'next/image';
import { Fragment } from 'react';

import CoursePath from '@/components/CoursePath';
import CourseSwitcher from '@/components/CourseSwitcher';
import Emph from '@/components/Emph';
import ReviewsSection from '@/components/ReviewsSection';
import SmartLink from '@/components/SmartLink';
import { ButtonLink, CtaBand, Eyebrow, Facts, PageHero, SectionHeading, SectionIntro } from '@/components/ui';
import { getCourse, getCourses, getPageContent } from '@/lib/data';
import { dayOfMonth, monthLong, todayInBudapest, weekday, year } from '@/lib/dates';
import { fill, formatHuf, priceSummary } from '@/lib/format';
import type { Link } from '@/lib/types';

/** "Text with a [linked] part" → the bracketed part becomes a link. */
function InlineLink({ text, link }: { text: string; link: Link }) {
  return text.split(/\[([^\]]+)\]/).map((part, i) =>
    i % 2 === 1 ? (
      <SmartLink key={i} href={link.href} className="link font-semibold text-teal">
        {part}
      </SmartLink>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** "2026-09" → "2026. szeptember" */
const intakeLabel = (month: string) => `${year(`${month}-01`)}. ${monthLong(`${month}-01`)}`;

/**
 * Shared template of the course pages (/kezdo-kurzus, /szakmai-kurzus). Sections adapt to what the
 * page content provides: dated groups or rolling enrolment, numbered benefits or a paragraph, path
 * steps or text after the course.
 */
export default async function CoursePageView({ pageKey }: { pageKey: 'kezdo-kurzus' | 'szakmai-kurzus' }) {
  const page = await getPageContent(pageKey);
  const [course, courses] = await Promise.all([getCourse(page.courseId), getCourses()]);
  const { hero, starts, benefits, curriculum, why, after, prices, cta } = page;
  const signup = (label: string) => ({ label, href: course.signupUrl });
  // Rolling-enrolment courses show the next intake month until it has passed.
  const nextIntake = course.nextIntake && course.nextIntake >= todayInBudapest().slice(0, 7) ? course.nextIntake : undefined;
  const facts = hero.facts.map((f) => ({ ...f, value: fill(f.value, { lowestPrice: priceSummary(course.prices) }) }));

  return (
    <>
      <PageHero
        heading={hero.heading}
        lead={hero.lead}
        image={hero.image}
        top={<CourseSwitcher courses={courses} currentId={course.id} />}
        // the two course pages mirror each other
        layout={pageKey === 'kezdo-kurzus' ? { size: 'lg', tilt: -1.5, position: 'bottom', sun: 'top-left' } : { size: 'md', tilt: 2, position: 'bottom', sun: 'top-right' }}
      >
        <Facts facts={facts} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink link={signup(hero.primaryCtaLabel)} variant="primary" arrow />
          <ButtonLink link={hero.secondaryCta} variant="outline" />
        </div>
      </PageHero>

      {/* STARTS */}
      <section id="indulo" className="mx-auto flex max-w-[1440px] scroll-mt-28 flex-col gap-7 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
        <SectionHeading
          eyebrow={starts.eyebrow}
          heading={starts.heading}
          aside={course.starts.length > 0 && starts.intro ? <SectionIntro>{starts.intro}</SectionIntro> : undefined}
        />
        {course.starts.length > 0 ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
              {course.starts.map((start) => (
                <div key={start.id} className="flex items-center gap-5 rounded-3xl border border-line bg-paper p-6 lg:flex-col lg:items-start lg:gap-4 lg:p-8">
                  <span className="font-display text-[56px] leading-none text-rust lg:text-[80px]">{dayOfMonth(start.date)}</span>
                  <span className="flex grow flex-col gap-1">
                    <span className="text-[15px] font-semibold uppercase tracking-[0.12em] text-teal">
                      {year(start.date)}. {monthLong(start.date)}
                    </span>
                    <span className="text-lg font-semibold lg:text-xl">
                      {weekday(start.date)} · {start.startTime}–{start.endTime}
                    </span>
                  </span>
                  <ButtonLink link={signup(starts.ctaLabel)} variant="outline" size="md" className="hidden sm:inline-flex lg:mt-2" />
                </div>
              ))}
            </div>
            <ButtonLink link={signup(starts.ctaLabel)} variant="primary" arrow className="sm:hidden" />
          </>
        ) : starts.rolling ? (
          // Rolling enrolment: next intake month (until it has passed), how to enquire / apply.
          <div className={`grid gap-6 rounded-3xl border border-line bg-paper p-6 lg:gap-12 lg:p-10 ${nextIntake ? 'lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]' : ''}`}>
            {nextIntake ? (
              <div className="flex flex-col gap-2">
                <span className="text-[15px] font-semibold uppercase tracking-[0.12em] text-teal">{starts.rolling.nextIntakeLabel}</span>
                <span className="font-display text-[44px] leading-none text-rust lg:text-[60px]">{intakeLabel(nextIntake)}</span>
              </div>
            ) : null}
            <div className="flex max-w-[880px] flex-col gap-4">
              <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">
                <InlineLink text={starts.rolling.text} link={starts.rolling.inquiry} />
              </p>
              {starts.rolling.note && <p className="rounded-2xl bg-sand p-4 text-[15px] leading-relaxed text-ink2 lg:p-5">{starts.rolling.note}</p>}
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink link={signup(starts.ctaLabel)} variant="primary" arrow />
                <ButtonLink link={starts.rolling.inquiry} variant="outline" />
              </div>
            </div>
          </div>
        ) : (
          // No upcoming groups: an announcement instead of the date cards.
          <div className="flex flex-col gap-4 rounded-3xl border border-line bg-paper p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
            <p className="text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[28px]">{starts.empty.text}</p>
            <ButtonLink link={starts.empty.link} variant="outline" size="md" className="self-start sm:self-auto" />
          </div>
        )}
      </section>

      {/* BENEFITS */}
      <section className="on-dark relative mt-16 overflow-hidden bg-deep text-cream lg:mt-[120px]">
        <div className="sun absolute -right-28 -top-32 h-64 w-64 rounded-full opacity-90 lg:-right-44 lg:-top-56 lg:h-[520px] lg:w-[520px]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1440px] flex-col gap-9 px-5 py-16 lg:gap-14 lg:px-20 lg:py-28">
          <div className="flex flex-col gap-3.5 lg:gap-5">
            <Eyebrow dark>{benefits.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">
              <Emph text={benefits.heading} dark />
            </h2>
          </div>
          {benefits.text && <p className="max-w-[960px] text-lg leading-relaxed text-mist lg:text-[22px] lg:leading-[1.5]">{benefits.text}</p>}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-10">
            {benefits.items?.map((item, i) => (
              <div key={item} className="flex gap-4 border-t border-[#2b5a5e] pt-6 lg:gap-6 lg:pt-8">
                <span className="font-display text-[44px] leading-none text-gold lg:text-[56px]">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-lg leading-snug lg:text-[22px]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pt-16 lg:grid-cols-[7fr_5fr] lg:gap-20 lg:px-20 lg:pt-[120px]">
        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-3.5 lg:gap-5">
            <Eyebrow>{curriculum.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">{curriculum.heading}</h2>
          </div>
          <ol className="flex flex-col border-b border-line">
            {curriculum.items.map((item, i) => (
              <li key={item} className="flex gap-4 border-t border-line py-4 lg:gap-5 lg:py-5">
                <span className="w-7 shrink-0 font-display text-[26px] leading-none text-rust lg:text-[30px]">{i + 1}</span>
                <span className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{item}</span>
              </li>
            ))}
          </ol>
          {curriculum.bonus && (
            <div className="flex flex-col gap-3 rounded-3xl bg-sand p-6 lg:p-8">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-rust-dark">{curriculum.bonus.eyebrow}</span>
              <h3 className="font-display text-[30px] leading-none lg:text-[36px]">{curriculum.bonus.heading}</h3>
              <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{curriculum.bonus.text}</p>
            </div>
          )}
        </div>
        <Image
          src={curriculum.image.src}
          alt={curriculum.image.alt}
          width={curriculum.image.width}
          height={curriculum.image.height}
          sizes="40vw"
          className="hidden w-full rounded-3xl bg-deep object-cover lg:sticky lg:top-32 lg:block lg:aspect-[5/7]"
        />
      </section>

      {/* WHY */}
      <section className={`mx-auto grid max-w-[1440px] gap-5 px-5 pt-16 lg:px-20 lg:pt-[120px] ${why.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {why.map((card) => (
          <div key={card.eyebrow} className="flex flex-col gap-4 rounded-3xl border border-line bg-paper p-7 lg:gap-5 lg:p-12">
            <Eyebrow>{card.eyebrow}</Eyebrow>
            {card.heading && <h2 className="font-display text-[36px] leading-none lg:text-[48px]">{card.heading}</h2>}
            {card.quote && <p className="font-display text-[30px] italic leading-tight text-deep lg:text-[40px]">{card.quote}</p>}
            {card.quoteSource && <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{card.quoteSource}</p>}
            <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{card.text}</p>
          </div>
        ))}
      </section>

      <CoursePath after={after} />

      <ReviewsSection {...page.reviews} />

      {/* PRICES */}
      <section id="dijak" className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
        <SectionHeading eyebrow={prices.eyebrow} heading={prices.heading} aside={prices.intro ? <SectionIntro>{prices.intro}</SectionIntro> : undefined} />
        <div className="grid gap-4 md:grid-cols-3 lg:gap-5">
          {course.prices.map((price) => (
            <div
              key={price.id}
              className={`flex flex-col gap-2 rounded-3xl p-7 lg:p-9 ${price.highlighted ? 'on-dark bg-deep text-cream' : 'border border-line bg-paper'}`}
            >
              <span className={`text-xs font-bold uppercase tracking-[0.16em] ${price.highlighted ? 'text-gold' : 'text-teal'}`}>{price.label}</span>
              <span className="font-display text-[48px] leading-none lg:text-[60px]">
                {formatHuf(price.amount)}
                {price.per && ` / ${price.per}`}
              </span>
              {price.note && <span className={price.highlighted ? 'text-mist' : 'text-muted'}>{price.note}</span>}
            </div>
          ))}
        </div>
        <ButtonLink link={signup(prices.ctaLabel)} variant="primary" arrow className="self-stretch sm:self-start" />
      </section>

      <CtaBand {...cta} />
    </>
  );
}
