'use client';

/**
 * Photo slider (same mechanics as the reviews) with a lightbox. Client component: open/close state, keyboard (Esc, ←/→) and focus.
 * The lightbox is a native modal <dialog>, which traps focus and restores it on close.
 */
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { fill } from '@/lib/format';
import type { ImageRef } from '@/lib/types';

import { ArrowLeft, CloseIcon } from './icons';
import { SliderControls, useSnapSlider } from './SnapSlider';
import { useUi } from './UiStrings';

export default function Gallery({ images, label }: { images: ImageRef[]; label: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const { trackRef, pages, current: page, go } = useSnapSlider();
  const ref = useRef<HTMLDialogElement>(null);
  const ui = useUi();
  const current = index === null ? null : images[index];

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length));

  return (
    <>
      <div className="lg:rounded-[32px] lg:bg-sand lg:px-8 lg:pb-6 lg:pt-8" aria-roledescription={ui.common.slideshow}>
        <div
          ref={trackRef}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 [scroll-padding-left:20px] sm:gap-6 lg:mx-0 lg:px-0 lg:[scroll-padding-left:0px]"
        >
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              data-slide
              onClick={() => setIndex(i)}
              aria-label={fill(ui.gallery.zoom, { alt: img.alt })}
              className="group block w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl bg-deep sm:w-[calc(50%-12px)] lg:w-[calc((100%-48px)/3)]"
            >
              <Image
                src={img.src}
                alt=""
                width={img.width}
                height={img.height}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw"
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
        <SliderControls pages={pages} current={page} go={go} prevLabel={ui.gallery.previous} nextLabel={ui.gallery.next} />
      </div>
      <dialog
        ref={ref}
        aria-label={label}
        onClose={() => setIndex(null)}
        onClick={(e) => e.target === e.currentTarget && setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
        className="m-auto max-h-[92vh] w-[min(94vw,1100px)] overflow-visible border-0 bg-transparent p-0 backdrop:bg-night/85"
      >
        {current && (
          <figure className="flex flex-col items-center gap-3">
            <Image
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="94vw"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
            <figcaption className="text-sm text-mist">
              {index! + 1} / {images.length}
            </figcaption>
          </figure>
        )}
        <div className="on-dark mt-3 flex justify-center gap-3">
          <button type="button" aria-label={ui.gallery.previousImage} className="btn-icon border-cream text-cream" onClick={() => step(-1)}>
            <ArrowLeft />
          </button>
          <button type="button" aria-label={ui.common.close} className="btn-icon border-cream text-cream" onClick={() => setIndex(null)}>
            <CloseIcon />
          </button>
          <button type="button" aria-label={ui.gallery.nextImage} className="btn-icon border-cream text-cream" onClick={() => step(1)}>
            <span className="rotate-180">
              <ArrowLeft />
            </span>
          </button>
        </div>
      </dialog>
    </>
  );
}
