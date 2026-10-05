import Image from 'next/image';
import { Fragment } from 'react';

import { ArrowRight } from '@/components/icons';
import OfferingCard from '@/components/OfferingCard';
import SmartLink from '@/components/SmartLink';
import { ButtonLink, Eyebrow, PlaceholderAvatar, SectionHeading, SectionIntro } from '@/components/ui';
import { getCourse, getInstructors, getUi } from '@/lib/data';
import { dayOfMonth, monthLong, todayInBudapest, weekday, year } from '@/lib/dates';
import { formatHuf, priceSummary } from '@/lib/format';
import type { Course, OfferingCardData, UiStrings } from '@/lib/types';

import { resolveFacts } from './shared';
import type { BlockProps } from './types';

/** "2026-09" → "2026. szeptember" */
const intakeLabel = (month: string) => `${year(`${month}-01`)}. ${monthLong(`${month}-01`)}`;

/** A course as an offering card: badge, text, rhythm/length/price and a link to its page. */
const courseCard = (course: Course, ui: UiStrings): OfferingCardData => ({
  badge: course.card.badge,
  title: course.title,
  text: course.card.text,
  facts: [
    { label: ui.course.rhythm, value: course.rhythm },
    { label: ui.course.length, value: course.length },
    { label: ui.course.price, value: priceSummary(course.prices) },
  ],
  cta: { label: course.card.ctaLabel, href: course.url },
});

/** "Képzések és alkalmak": offering cards (courses come from the course records) + the instructors' avatars. */
export async function Offerings({ block, className }: BlockProps<'offerings'>) {
  const [ui, instructors] = await Promise.all([getUi(), getInstructors()]);
  const cards = await Promise.all(
    block.cards.map(async (card) => {
      if ('course' in card) return courseCard(await getCourse(card.course), ui);
      return { ...card, facts: await resolveFacts(card.facts) };
    }),
  );
  // Instructor avatars: real photos once instructors exist, four placeholders until then.
  const avatars = instructors.filter((i) => i.photo).slice(0, 4);
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-14 lg:px-20 ${className}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">{block.heading}</h2>
        </div>
        <SmartLink href={block.instructorsLink.href} className="flex items-center gap-4 text-teal lg:pb-1.5">
          <span className="flex">
            {avatars.length > 0
              ? avatars.map((a, i) => (
                  <Image
                    key={a.id}
                    src={a.photo.src}
                    alt=""
                    width={52}
                    height={52}
                    className={`h-[52px] w-[52px] rounded-full border-[3px] border-cream object-cover ${i > 0 ? '-ml-3.5' : ''}`}
                  />
                ))
              : [0, 1, 2, 3].map((i) => <PlaceholderAvatar key={i} className={`h-[52px] w-[52px] border-[3px] border-cream ${i > 0 ? '-ml-3.5' : ''}`} />)}
          </span>
          <span className="link link-arrow text-base lg:whitespace-nowrap lg:text-[17px]">
            {block.instructorsLink.label}
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
  );
}

/** Upcoming groups of a course; rolling enrolment (next intake month + how to enquire); or an empty state. */
export async function CourseStarts({ block, className }: BlockProps<'courseStarts'>) {
  const [ui, course] = await Promise.all([getUi(), getCourse(block.course)]);
  const signup = { label: ui.common.signup, href: course.signupUrl };
  // Rolling-enrolment courses show the next intake month until it has passed.
  const nextIntake = course.nextIntake && course.nextIntake >= todayInBudapest().slice(0, 7) ? course.nextIntake : undefined;
  const { rolling } = block;
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading
        eyebrow={block.eyebrow}
        heading={block.heading}
        aside={course.starts.length > 0 && block.intro ? <SectionIntro>{block.intro}</SectionIntro> : undefined}
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
                <ButtonLink link={signup} variant="outline" size="md" className="hidden sm:inline-flex lg:mt-2" />
              </div>
            ))}
          </div>
          <ButtonLink link={signup} variant="primary" arrow className="sm:hidden" />
        </>
      ) : rolling ? (
        <div className={`grid gap-6 rounded-3xl border border-line bg-paper p-6 lg:gap-12 lg:p-10 ${nextIntake ? 'lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]' : ''}`}>
          {nextIntake ? (
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold uppercase tracking-[0.12em] text-teal">{ui.course.nextIntake}</span>
              <span className="font-display text-[44px] leading-none text-rust lg:text-[60px]">{intakeLabel(nextIntake)}</span>
            </div>
          ) : null}
          <div className="flex max-w-[880px] flex-col gap-4">
            <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">
              {rolling.text.map((seg, i) =>
                seg.href ? (
                  <SmartLink key={i} href={seg.href} className="link font-semibold text-teal">
                    {seg.text}
                  </SmartLink>
                ) : (
                  <Fragment key={i}>{seg.text}</Fragment>
                ),
              )}
            </p>
            {rolling.note && <p className="rounded-2xl bg-sand p-4 text-[15px] leading-relaxed text-ink2 lg:p-5">{rolling.note}</p>}
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink link={signup} variant="primary" arrow />
              <ButtonLink link={rolling.inquiry} variant="outline" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-paper p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
          <p className="text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[28px]">{ui.course.startsEmpty}</p>
          <ButtonLink link={ui.course.startsEmptyLink} variant="outline" size="md" className="self-start sm:self-auto" />
        </div>
      )}
    </section>
  );
}

/** A course's price options + signup button. */
export async function CoursePrices({ block, className }: BlockProps<'coursePrices'>) {
  const [ui, course] = await Promise.all([getUi(), getCourse(block.course)]);
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} aside={block.intro ? <SectionIntro>{block.intro}</SectionIntro> : undefined} />
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
      <ButtonLink link={{ label: ui.common.signup, href: course.signupUrl }} variant="primary" arrow className="self-stretch sm:self-start" />
    </section>
  );
}

/** Courses side by side with the same rows, so they line up. The first card is the dark one. */
export async function CourseCompare({ block, className }: BlockProps<'courseCompare'>) {
  const [ui, courses] = await Promise.all([getUi(), Promise.all(block.courses.map((id) => getCourse(id)))]);
  const thisMonth = todayInBudapest().slice(0, 7);
  // "Indulás": next dated group, else the next intake month, else rolling / soon.
  const start = (course: Course) => {
    const next = course.starts[0];
    if (next) return `${year(next.date)}. ${monthLong(next.date)} ${dayOfMonth(next.date)}., ${weekday(next.date)}`;
    if (course.nextIntake && course.nextIntake >= thisMonth) return intakeLabel(course.nextIntake);
    return course.nextIntake !== undefined ? ui.course.startRolling : ui.course.startSoon;
  };
  const rows = (course: Course) => [
    [ui.course.rhythm, course.rhythm],
    [ui.course.length, course.length],
    [ui.course.admission, course.admission],
    [ui.course.price, priceSummary(course.prices)],
    [ui.course.start, start(course)],
  ];
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
      <div className="grid gap-5 md:grid-cols-2 lg:gap-8">
        {courses.map((course, i) => {
          const dark = i === 0;
          return (
            <article
              key={course.id}
              className={`relative flex flex-col gap-6 overflow-hidden rounded-3xl p-7 lg:gap-8 lg:p-12 ${dark ? 'on-dark bg-teal text-cream' : 'border border-line bg-paper'}`}
            >
              {dark && <div className="sun absolute -right-24 -top-24 h-48 w-48 rounded-full" aria-hidden="true" />}
              <div className="relative flex flex-col gap-4">
                <span className={`self-start rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-deep ${dark ? 'bg-gold' : 'bg-sand'}`}>
                  {course.card.badge}
                </span>
                <h2 className="font-display text-[44px] leading-none lg:text-[64px]">{course.title}</h2>
                <p className={`leading-relaxed lg:text-lg lg:leading-[28px] ${dark ? 'text-[#d7e5e2]' : 'text-ink2'}`}>{course.card.text}</p>
              </div>
              <dl className="mt-auto flex flex-col text-[15px] lg:text-[17px]">
                {rows(course).map(([label, value]) => (
                  <div key={label} className={`flex justify-between gap-4 border-t py-3 ${dark ? 'border-[#2f7a7d]' : 'border-line'}`}>
                    <dt className={dark ? 'text-[#b9d2ce]' : 'text-muted'}>{label}</dt>
                    <dd className="text-right font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink link={{ label: ui.course.details, href: course.url }} variant={dark ? 'gold' : 'primary'} arrow />
                <ButtonLink link={{ label: ui.common.signup, href: course.signupUrl }} variant={dark ? 'outline-cream' : 'outline'} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
