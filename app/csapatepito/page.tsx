import type { Metadata } from 'next';
import Image from 'next/image';

import { CheckIcon } from '@/components/icons';
import QuoteRequestForm from '@/components/QuoteRequestForm';
import { Eyebrow, HeroButtons, PageHero, SectionHeading } from '@/components/ui';
import { getPageContent, getTeamBuildingProgrammes } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('csapatepito');
  return { title: meta.title, description: meta.description };
}

export default async function TeamBuildingPage() {
  const [{ hero, programmes: copy, tailored, form }, programmes] = await Promise.all([
    getPageContent('csapatepito'),
    getTeamBuildingProgrammes(),
  ]);

  return (
    <>
      <PageHero heading={hero.heading} lead={hero.lead} image={hero.image} layout={{ size: 'md', tilt: 2.5, position: 'bottom', sun: 'bottom-left' }}>
        <HeroButtons primary={hero.primaryCta} secondary={hero.secondaryCta} />
      </PageHero>

      {/* PROGRAMMES */}
      <section id="programok" className="mx-auto flex max-w-[1440px] scroll-mt-28 flex-col gap-7 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
        <SectionHeading eyebrow={copy.eyebrow} heading={copy.heading} />
        <div className="flex flex-col border-b border-line">
          {programmes.map((programme, i) => (
            <article key={programme.id} className="grid gap-4 border-t border-line py-7 lg:grid-cols-[80px_5fr_7fr] lg:gap-10 lg:py-10">
              <span className="font-display text-[44px] leading-none text-rust lg:text-[64px]">{String(i + 1).padStart(2, '0')}</span>
              <div className="flex flex-col gap-4">
                <h3 className="font-display text-[34px] leading-none lg:text-[44px]">{programme.name}</h3>
                <dl className="flex flex-col gap-2 text-[15px]">
                  <div className="flex gap-2">
                    <dt className="text-muted">{copy.durationLabel}</dt>
                    <dd className="font-semibold">{programme.duration}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted">{copy.venueLabel}</dt>
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

      {/* TAILORED + FORM */}
      <section
        id="ajanlat"
        className="mx-auto grid max-w-[1440px] scroll-mt-28 gap-8 px-5 pb-16 pt-16 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-20 lg:pb-[120px] lg:pt-[120px]"
      >
        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-3.5 lg:gap-5">
            <Eyebrow>{tailored.eyebrow}</Eyebrow>
            <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">{tailored.heading}</h2>
          </div>
          <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{tailored.text}</p>
          <ul className="flex flex-col border-b border-line">
            {tailored.goals.map((goal) => (
              <li key={goal} className="flex items-start gap-3 border-t border-line py-3.5">
                <span className="mt-0.5 text-teal">
                  <CheckIcon />
                </span>
                <span className="leading-snug">{goal}</span>
              </li>
            ))}
          </ul>
          <Image
            src={tailored.image.src}
            alt={tailored.image.alt}
            width={tailored.image.width}
            height={tailored.image.height}
            sizes="40vw"
            className="hidden aspect-[4/3] w-full rounded-3xl bg-deep object-cover lg:block"
          />
        </div>
        <QuoteRequestForm content={form} />
      </section>
    </>
  );
}
