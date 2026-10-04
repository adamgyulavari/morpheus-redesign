import { getReviews } from '@/lib/data';

import Emph from './Emph';
import ReviewSlider from './ReviewSlider';
import { Eyebrow } from './ui';

/** "Hallgatóink mondták" — the same review collection on the homepage and the course page. */
export default async function ReviewsSection({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro: string }) {
  const reviews = await getReviews();
  return (
    <section aria-labelledby="velemenyek" className="mx-auto flex max-w-[1440px] flex-col gap-6 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
      <div className="flex flex-col gap-3.5 px-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:px-0">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id="velemenyek" className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">
            <Emph text={heading} />
          </h2>
        </div>
        <p className="text-[15px] text-muted lg:max-w-[380px] lg:pb-2 lg:text-lg lg:leading-relaxed lg:text-ink2">{intro}</p>
      </div>
      <ReviewSlider reviews={reviews} />
    </section>
  );
}
