import type { Metadata } from 'next';
import Image from 'next/image';
import { Fragment } from 'react';

import DetailsDialog from '@/components/DetailsDialog';
import { CtaBand, PageHero } from '@/components/ui';
import { getInstructors, getPageContent } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPageContent('oktatok');
  return { title: meta.title, description: meta.description };
}

const Lines = ({ text }: { text: string }) =>
  text.split('\n').map((line, i, all) => (
    <Fragment key={i}>
      {line}
      {i < all.length - 1 && <br />}
    </Fragment>
  ));

export default async function InstructorsPage() {
  const [{ hero, moreLabel, cta }, instructors] = await Promise.all([getPageContent('oktatok'), getInstructors()]);
  return (
    <>
      <PageHero heading={hero.heading} lead={hero.lead} image={hero.image} layout={{ size: 'sm', tilt: 2, position: 'top' }} />

      <section className="mx-auto grid max-w-[1440px] gap-5 px-5 pt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 lg:px-20 lg:pt-[88px]">
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
                <DetailsDialog label={moreLabel} titleId={titleId} buttonClassName="link mt-auto min-h-[44px] self-start font-bold text-teal">
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

      <CtaBand {...cta} />
    </>
  );
}
