import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

import type { Fact, ImageRef, Link } from '@/lib/types';

import Emph from './Emph';
import { ArrowRight } from './icons';
import SmartLink from './SmartLink';

/** Small uppercase label above section headings. */
export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={`text-xs font-bold uppercase tracking-[0.22em] lg:text-[13px] ${dark ? 'text-gold' : 'text-teal'}`}>
      {children}
    </span>
  );
}

/** Eyebrow + h2, optionally with an intro paragraph or link on the right (desktop). */
export function SectionHeading({
  eyebrow,
  heading,
  aside,
  size = 'md',
  id,
}: {
  eyebrow: string;
  heading: string;
  aside?: ReactNode;
  /** md = 68px (inner pages), lg = 76px (homepage) */
  size?: 'md' | 'lg';
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
      <div className="flex flex-col gap-3.5 lg:gap-5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2
          id={id}
          className={`font-display text-[42px] leading-[1.02] lg:leading-none ${size === 'lg' ? 'lg:text-[76px]' : 'lg:text-[68px]'}`}
        >
          <Emph text={heading} />
        </h2>
      </div>
      {aside}
    </div>
  );
}

/** Intro paragraph used as the right-hand `aside` of a SectionHeading. */
export function SectionIntro({ children }: { children: ReactNode }) {
  return <p className="text-[15.5px] leading-relaxed text-ink2 lg:max-w-[440px] lg:text-lg lg:leading-[28px]">{children}</p>;
}

/** Button-styled link. `arrow` adds the trailing arrow used on primary calls to action. */
export function ButtonLink({
  link,
  variant,
  size = 'lg',
  arrow = false,
  className = '',
  ...rest
}: {
  link: Link;
  variant: 'primary' | 'outline' | 'gold' | 'cream' | 'outline-cream';
  size?: 'md' | 'lg';
  arrow?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <SmartLink href={link.href} className={`btn btn-${size} btn-${variant} ${className}`} {...rest}>
      {link.label}
      {arrow && <ArrowRight />}
    </SmartLink>
  );
}

/** Underlined text link with a trailing arrow. */
export function ArrowLink({ link, className = '' }: { link: Link; className?: string }) {
  return (
    <SmartLink href={link.href} className={`link link-arrow text-base text-teal lg:text-[17px] ${className}`}>
      {link.label}
      <ArrowRight />
    </SmartLink>
  );
}

/** Two-column label/value facts under a hero lead. */
export function Facts({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:max-w-[640px]">
      {facts.map((f) => (
        <div key={f.label} className="flex flex-col gap-1 border-t border-line pt-3">
          <dt className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{f.label}</dt>
          <dd className="text-base font-semibold lg:text-[17px]">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** How the hero photo sits next to the text. Presentation only — chosen per page in code. */
export type HeroImageLayout = {
  /** landscape: sm / md / lg; portrait: a tall card */
  shape?: 'landscape' | 'portrait';
  size?: 'sm' | 'md' | 'lg';
  /** degrees, negative = counter-clockwise; phones use 60% of it */
  tilt?: number;
  /**
   * bottom: the photo sits at the bottom of a 440px area (heroes with long text);
   * top: the photo starts at the top and the area is only as tall as the photo (short heroes);
   * middle: a taller photo centred on the sun
   */
  position?: 'top' | 'middle' | 'bottom';
  /** where the sun sits behind the photo on desktop */
  sun?: 'top-right' | 'top-left' | 'bottom-left';
};

/**
 * The sun sits in the same spot on every hero. Set to null to let each page choose via
 * `layout.sun` again (the per-page option is kept for now).
 */
const FIXED_SUN: HeroImageLayout['sun'] | null = 'top-right';

/**
 * Photo size/placement per position, and the height of the photo area that goes with it. All
 * arrangements keep clear of the top-right corner so the sun stays visible (≥ ⅓ of it). Top-placed
 * photos are a bit smaller, so short heroes stay short.
 */
const PHOTO: Record<'top' | 'middle' | 'bottom', Record<string, { photo: string; area: string }>> = {
  bottom: {
    'landscape-sm': { photo: 'lg:bottom-6 lg:left-6 lg:h-[310px] lg:w-[74%]', area: 'lg:h-[440px]' },
    'landscape-md': { photo: 'lg:bottom-6 lg:left-0 lg:h-[340px] lg:w-[86%]', area: 'lg:h-[440px]' },
    'landscape-lg': { photo: 'lg:bottom-6 lg:left-0 lg:h-[345px] lg:w-[87%]', area: 'lg:h-[440px]' },
    portrait: { photo: 'lg:bottom-6 lg:left-[10%] lg:h-[370px] lg:w-[265px]', area: 'lg:h-[440px]' },
  },
  top: {
    // starts a little below the sun's top edge so the sun shows above it
    'landscape-sm': { photo: 'lg:top-14 lg:left-6 lg:h-[290px] lg:w-[72%]', area: 'lg:h-[370px]' },
    'landscape-md': { photo: 'lg:top-14 lg:left-0 lg:h-[320px] lg:w-[82%]', area: 'lg:h-[400px]' },
    'landscape-lg': { photo: 'lg:top-20 lg:left-0 lg:h-[330px] lg:w-[84%]', area: 'lg:h-[430px]' },
    portrait: { photo: 'lg:top-10 lg:left-[12%] lg:h-[300px] lg:w-[215px]', area: 'lg:h-[350px]' },
  },
  middle: {
    // vertically centred on the sun (300px, at the top of the area); may be taller than it
    'landscape-sm': { photo: 'lg:top-[30px] lg:left-6 lg:h-[240px] lg:w-[72%]', area: 'lg:h-[300px]' },
    'landscape-md': { photo: 'lg:top-[10px] lg:left-0 lg:h-[280px] lg:w-[80%]', area: 'lg:h-[300px]' },
    'landscape-lg': { photo: 'lg:-top-[10px] lg:left-0 lg:h-[320px] lg:w-[82%]', area: 'lg:h-[320px]' },
    portrait: { photo: 'lg:-top-10 lg:left-auto lg:right-[150px] lg:h-[380px] lg:w-[272px]', area: 'lg:h-[340px]' },
  },
};
const SUN: Record<NonNullable<HeroImageLayout['sun']>, string> = {
  'top-right': 'lg:-right-5 lg:top-0 lg:h-[300px] lg:w-[300px]',
  'top-left': 'lg:-left-6 lg:-top-2 lg:h-[240px] lg:w-[240px]',
  'bottom-left': 'lg:-bottom-4 lg:-left-6 lg:h-[260px] lg:w-[260px]',
};

/**
 * The one hero used by every inner page: title, lead, optional content above the title (`top`,
 * e.g. the course switcher) and below the lead (`children`: facts, buttons, filter chips), and a
 * tilted photo with the sun behind it. The text column, spacing and type sizes are identical on
 * every page; only the photo arrangement varies via `layout`.
 */
export function PageHero({
  top,
  heading,
  lead,
  image,
  layout = {},
  children,
}: {
  /** Optional element above the title, e.g. the course switcher. */
  top?: ReactNode;
  heading: string;
  lead: string;
  image: ImageRef;
  layout?: HeroImageLayout;
  children?: ReactNode;
}) {
  const { shape = 'landscape', size = 'md', tilt = -2.5, position = 'bottom' } = layout;
  const sun = FIXED_SUN ?? layout.sun ?? 'top-right';
  const placement = PHOTO[position][shape === 'portrait' ? 'portrait' : `landscape-${size}`]!;
  const photo = placement.photo;
  return (
    <section className="relative mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] items-start gap-12 overflow-hidden px-5 pt-8 lg:grid-cols-[7fr_5fr] lg:gap-16 lg:overflow-visible lg:px-20 lg:pt-16">
      <div className="sun absolute -right-24 -top-28 h-48 w-48 rounded-full lg:hidden" aria-hidden="true" />
      <div className="relative flex flex-col gap-5 lg:gap-7">
        {top}
        <h1 className="font-display text-[64px] leading-[0.95] lg:text-[128px] lg:leading-[0.9] lg:tracking-[-0.01em]">{heading}</h1>
        <p className="text-[17px] leading-relaxed text-ink2 lg:max-w-[620px] lg:text-xl lg:leading-[28px]">{lead}</p>
        {children}
      </div>
      <div className={`relative ${placement.area} ${shape === 'portrait' ? 'h-[360px]' : 'h-[260px] sm:h-[340px]'}`}>
        <div className={`sun absolute hidden rounded-full lg:block ${SUN[sun]}`} data-hero-sun aria-hidden="true" />
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          style={{ '--tilt': `${tilt}deg` } as CSSProperties}
          data-hero-photo
          className={`absolute rounded-[22px] border-8 border-paper bg-deep object-cover shadow-[0_24px_48px_-24px_rgba(11,58,63,0.55)] rotate-[calc(var(--tilt)*0.6)] lg:rotate-[var(--tilt)] ${
            shape === 'portrait' ? 'left-[16%] top-0 h-full w-[68%]' : 'bottom-0 left-0 h-full w-full'
          } ${photo}`}
        />
      </div>
    </section>
  );
}

/** Two hero buttons: primary (with arrow) + outline. */
export function HeroButtons({ primary, secondary }: { primary: Link; secondary: Link }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ButtonLink link={primary} variant="primary" arrow />
      <ButtonLink link={secondary} variant="outline" />
    </div>
  );
}

/** Dark rounded call-to-action band that closes most pages. */
export function CtaBand({
  eyebrow,
  heading,
  text,
  primary,
  secondary,
}: {
  eyebrow: string;
  heading: string;
  text: string;
  primary: Link;
  secondary: Link;
}) {
  return (
    <section className="mx-3 mb-16 mt-16 lg:mx-auto lg:mb-[120px] lg:mt-[120px] lg:max-w-[1440px] lg:px-20">
      <div className="on-dark relative grid items-center gap-5 overflow-hidden rounded-[26px] bg-deep px-6 py-10 text-cream lg:grid-cols-[7fr_5fr] lg:gap-16 lg:rounded-[32px] lg:px-20 lg:py-[72px]">
        <div
          className="sun absolute -right-24 -top-24 h-52 w-52 rounded-full opacity-85 lg:-bottom-56 lg:-right-32 lg:top-auto lg:h-[440px] lg:w-[440px]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5">
          <Eyebrow dark>{eyebrow}</Eyebrow>
          <h2 className="font-display text-[40px] leading-[1.02] lg:text-[64px] lg:leading-none">
            <Emph text={heading} dark />
          </h2>
          <p className="leading-relaxed text-mist lg:text-lg lg:leading-[28px]">{text}</p>
        </div>
        <div className="relative flex flex-col gap-3.5 lg:items-start">
          <ButtonLink link={primary} variant="gold" arrow />
          <ButtonLink link={secondary} variant="outline-cream" />
        </div>
      </div>
    </section>
  );
}

/** Striped placeholder avatar for people without a photo yet (as in the static design). */
export function PlaceholderAvatar({ className, label }: { className: string; label?: string }) {
  return (
    <div
      className={`ph flex shrink-0 items-center justify-center rounded-full p-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </div>
  );
}
