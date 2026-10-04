import Image from 'next/image';

import type { CoursePage } from '@/lib/types';

import { SectionHeading } from './ui';

/** "What comes after the course": numbered path steps, or paragraphs with a photo. */
export default function CoursePath({ after }: { after: CoursePage['after'] }) {
  return (
    <section className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
      <SectionHeading eyebrow={after.eyebrow} heading={after.heading} />
      {after.paragraphs && (
        <div className={`grid items-center gap-8 ${after.image ? 'lg:grid-cols-[7fr_5fr] lg:gap-20' : ''}`}>
          <div className="flex flex-col gap-5">
            {after.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[1.6]">
                {p}
              </p>
            ))}
          </div>
          {after.image && (
            <Image
              src={after.image.src}
              alt={after.image.alt}
              width={after.image.width}
              height={after.image.height}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="aspect-[4/3] w-full rounded-3xl bg-deep object-cover"
            />
          )}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        {after.steps?.map((step, i) => {
          const first = i === 0;
          return (
            <div
              key={step.title}
              className={`relative flex flex-col gap-3 rounded-3xl p-7 lg:p-9 ${first ? 'on-dark bg-teal text-cream' : 'border border-line bg-paper'}`}
            >
              <span className={`font-display text-[56px] leading-none ${first ? 'text-gold' : 'text-rust'}`}>{i + 1}</span>
              <span className={`text-xs font-bold uppercase tracking-[0.16em] ${first ? 'text-gold' : 'text-teal'}`}>{step.kicker}</span>
              <h3 className="font-display text-[34px] leading-none lg:text-[40px]">{step.title}</h3>
              <p className={`leading-relaxed ${first ? 'text-[#d7e5e2]' : 'text-ink2'}`}>{step.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
