import type { Metadata } from 'next';

import CoursePath from '@/components/CoursePath';
import { ButtonLink, CtaBand, SectionHeading, PageHero } from '@/components/ui';
import { getCourses, getPageContent } from '@/lib/data';
import { dayOfMonth, monthLong, todayInBudapest, weekday, year } from '@/lib/dates';
import { priceSummary } from '@/lib/format';
import type { Course } from '@/lib/types';

// Static page, regenerated at most once a day (ISR) so the "Indulás" row follows the start dates.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('kepzesek');
  return { title: meta.title, description: meta.description };
}

/** Overview of the courses: the "Képzések" nav item lands here, then visitors pick a course. */
export default async function CoursesOverviewPage() {
  const [{ hero, compare, path, cta }, all] = await Promise.all([getPageContent('kepzesek'), getCourses()]);
  // only courses that have their own page on this site
  const courses = all.filter((c) => c.url.startsWith('/'));
  const thisMonth = todayInBudapest().slice(0, 7);

  // "Indulás": next dated group, else the next intake month, else rolling / soon.
  const start = (course: Course) => {
    const next = course.starts[0];
    if (next) return `${year(next.date)}. ${monthLong(next.date)} ${dayOfMonth(next.date)}., ${weekday(next.date)}`;
    if (course.nextIntake && course.nextIntake >= thisMonth) return `${year(`${course.nextIntake}-01`)}. ${monthLong(`${course.nextIntake}-01`)}`;
    return course.nextIntake !== undefined ? compare.startRolling : compare.startSoon;
  };

  const rows = (course: Course) => {
    const fact = (label: string) => course.card.facts.find((f) => f.label === label)?.value ?? '';
    return [
      [compare.labels.rhythm, fact('Ritmus')],
      [compare.labels.length, fact('Hossz')],
      [compare.labels.admission, course.admission],
      [compare.labels.price, priceSummary(course.prices)],
      [compare.labels.start, start(course)],
    ];
  };

  return (
    <>
      <PageHero heading={hero.heading} lead={hero.lead} image={hero.image} layout={{ shape: 'portrait', tilt: 2.5, position: 'middle', sun: 'bottom-left' }} />

      {/* COMPARISON — same rows in both cards so they line up side by side */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 pt-12 lg:gap-12 lg:px-20 lg:pt-[88px]">
        <SectionHeading eyebrow={compare.eyebrow} heading={compare.heading} />
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
                  <span
                    className={`self-start rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-deep ${dark ? 'bg-gold' : 'bg-sand'}`}
                  >
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
                  <ButtonLink link={{ label: compare.detailsLabel, href: course.url }} variant={dark ? 'gold' : 'primary'} arrow />
                  <ButtonLink link={{ label: compare.signupLabel, href: course.signupUrl }} variant={dark ? 'outline-cream' : 'outline'} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <CoursePath after={path} />

      <CtaBand {...cta} />
    </>
  );
}
