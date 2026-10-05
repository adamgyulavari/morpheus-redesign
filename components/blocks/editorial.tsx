import Image from 'next/image';

import Emph from '@/components/Emph';
import { ArrowRight, CheckIcon } from '@/components/icons';
import SmartLink from '@/components/SmartLink';
import { ArrowLink, ButtonLink, CtaBand, Eyebrow, Facts, SectionHeading } from '@/components/ui';
import VideoEmbed from '@/components/VideoEmbed';
import { getCtaBand } from '@/lib/data';

import { resolveFacts } from './shared';
import type { BlockProps } from './types';

/** A reusable call-to-action band, referenced by id. */
export async function CtaBandBlock({ block, className }: BlockProps<'ctaBand'>) {
  const band = await getCtaBand(block.ctaBand);
  return <CtaBand {...band} className={className} />;
}

/** Eyebrow + heading on the left, a paragraph (and optional facts) on the right. `xl` = a big title. */
export async function TextSplit({ block, className }: BlockProps<'textSplit'>) {
  const xl = block.size === 'xl';
  const facts = block.facts && (await resolveFacts(block.facts));
  return (
    <section
      id={block.anchor}
      className={`mx-auto grid max-w-[1440px] px-5 lg:grid-cols-[5fr_7fr] lg:px-20 ${xl ? 'gap-8 lg:gap-20' : 'gap-6 lg:gap-16'} ${className}`}
    >
      <div className="flex flex-col gap-3.5 lg:gap-5">
        <Eyebrow>{block.eyebrow}</Eyebrow>
        <h2 className={xl ? 'font-display text-[48px] leading-none lg:text-[96px]' : 'font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none'}>
          <Emph text={block.heading} />
        </h2>
      </div>
      <div className="flex flex-col gap-6 lg:pt-4">
        <p className="text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[28px]">{block.text}</p>
        {facts && <Facts facts={facts} />}
      </div>
    </section>
  );
}

/** Full-width dark band with a big statement (e.g. "A nevünk"). */
export function Statement({ block, className }: BlockProps<'statement'>) {
  return (
    <section id={block.anchor} className={`on-dark relative overflow-hidden bg-deep text-cream ${className}`}>
      <div className="sun absolute -left-32 -top-32 h-72 w-72 rounded-full opacity-90 lg:-left-48 lg:-top-48 lg:h-[480px] lg:w-[480px]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-16 lg:grid lg:grid-cols-[5fr_7fr] lg:gap-16 lg:px-20 lg:py-28">
        <div className="hidden lg:block" aria-hidden="true" />
        <div className="flex flex-col gap-6 lg:gap-8">
          <Eyebrow dark>{block.eyebrow}</Eyebrow>
          <p className="font-display text-[40px] leading-[1.05] lg:text-[64px] lg:leading-none">
            <Emph text={block.heading} dark />
          </p>
          <p className="text-[17px] leading-relaxed text-mist lg:text-xl lg:leading-[28px]">{block.text}</p>
        </div>
      </div>
    </section>
  );
}

/** Text with an optional quote beside a photo. */
export function ImageText({ block, className }: BlockProps<'imageText'>) {
  return (
    <section id={block.anchor} className={`mx-auto grid max-w-[1440px] items-center gap-10 px-5 lg:grid-cols-2 lg:gap-20 lg:px-20 ${className}`}>
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">
            <Emph text={block.heading} />
          </h2>
        </div>
        {block.quote && <p className="font-display text-[26px] italic leading-snug text-deep lg:text-[32px]">{block.quote}</p>}
        {block.paragraphs.map((p) => (
          <p key={p.slice(0, 24)} className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">
            {p}
          </p>
        ))}
      </div>
      <Image
        src={block.image.src}
        alt={block.image.alt}
        width={block.image.width}
        height={block.image.height}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="aspect-[4/3] w-full rounded-[22px] bg-deep object-cover lg:rounded-3xl"
      />
    </section>
  );
}

/** Cards linking to other pages ("Hol kezdenéd?"). */
export function LinkCards({ block, className }: BlockProps<'linkCards'>) {
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
      <div className="grid gap-5 md:grid-cols-3">
        {block.cards.map((card) => (
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
  );
}

/** Dark band with numbered questions and a closing line + button ("Neked szól, ha…"). */
export function Questions({ block, className }: BlockProps<'questions'>) {
  return (
    <section id={block.anchor} className={`on-dark relative overflow-hidden bg-deep text-cream ${className}`}>
      <div className="sun absolute -right-28 -top-32 h-64 w-64 rounded-full opacity-90 lg:-right-44 lg:-top-56 lg:h-[520px] lg:w-[520px]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-9 px-5 py-16 lg:gap-16 lg:px-20 lg:py-28">
        <div className="flex max-w-[760px] flex-col gap-4 pr-14 lg:gap-5 lg:pr-0">
          <Eyebrow dark>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">
            <Emph text={block.heading} dark />
          </h2>
        </div>
        <div className="grid gap-7 lg:grid-cols-2 lg:gap-x-20 lg:gap-y-14">
          {block.items.map((item, i) => (
            <div key={item.title} className="flex gap-5 border-t border-[#2b5a5e] pt-6 lg:gap-7 lg:pt-8">
              <span className="font-display text-[32px] leading-none text-gold lg:text-[44px]">{String(i + 1).padStart(2, '0')}</span>
              <div className="flex flex-col gap-2 lg:gap-3">
                <h3 className="text-xl font-semibold leading-tight lg:text-[26px]">{item.title}</h3>
                <p className="text-base leading-relaxed text-mist lg:text-lg lg:leading-[28px]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5 rounded-[20px] bg-deep2 px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:rounded-3xl lg:px-12 lg:py-10">
          <span className="font-display text-4xl leading-tight lg:text-[52px] lg:leading-none">
            <Emph text={block.closing} dark />
          </span>
          <ButtonLink link={block.cta} variant="gold" arrow />
        </div>
      </div>
    </section>
  );
}

/** Dark band: numbered points and/or a paragraph ("Amit a kurzus ad neked"). */
export function Benefits({ block, className }: BlockProps<'benefits'>) {
  return (
    <section id={block.anchor} className={`on-dark relative overflow-hidden bg-deep text-cream ${className}`}>
      <div className="sun absolute -right-28 -top-32 h-64 w-64 rounded-full opacity-90 lg:-right-44 lg:-top-56 lg:h-[520px] lg:w-[520px]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-9 px-5 py-16 lg:gap-14 lg:px-20 lg:py-28">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow dark>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">
            <Emph text={block.heading} dark />
          </h2>
        </div>
        {block.text && <p className="max-w-[960px] text-lg leading-relaxed text-mist lg:text-[22px] lg:leading-[1.5]">{block.text}</p>}
        {block.items && block.items.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-10">
            {block.items.map((item, i) => (
              <div key={item} className="flex gap-4 border-t border-[#2b5a5e] pt-6 lg:gap-6 lg:pt-8">
                <span className="font-display text-[44px] leading-none text-gold lg:text-[56px]">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-lg leading-snug lg:text-[22px]">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Numbered list (+ optional bonus box) beside a sticky photo ("Mit fogsz tanulni?"). */
export function Curriculum({ block, className }: BlockProps<'curriculum'>) {
  return (
    <section id={block.anchor} className={`mx-auto grid max-w-[1440px] gap-10 px-5 lg:grid-cols-[7fr_5fr] lg:gap-20 lg:px-20 ${className}`}>
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex flex-col gap-3.5 lg:gap-5">
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">
            <Emph text={block.heading} />
          </h2>
        </div>
        <ol className="flex flex-col border-b border-line">
          {block.items.map((item, i) => (
            <li key={item} className="flex gap-4 border-t border-line py-4 lg:gap-5 lg:py-5">
              <span className="w-7 shrink-0 font-display text-[26px] leading-none text-rust lg:text-[30px]">{i + 1}</span>
              <span className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{item}</span>
            </li>
          ))}
        </ol>
        {block.bonus && (
          <div className="flex flex-col gap-3 rounded-3xl bg-sand p-6 lg:p-8">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-rust-dark">{block.bonus.eyebrow}</span>
            <h3 className="font-display text-[30px] leading-none lg:text-[36px]">{block.bonus.heading}</h3>
            <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{block.bonus.text}</p>
          </div>
        )}
      </div>
      <Image
        src={block.image.src}
        alt={block.image.alt}
        width={block.image.width}
        height={block.image.height}
        sizes="40vw"
        className="hidden w-full rounded-3xl bg-deep object-cover lg:sticky lg:top-32 lg:block lg:aspect-[5/7]"
      />
    </section>
  );
}

/** One or two cards with an eyebrow, a heading or quote, and a paragraph ("Miért a Morpheus?"). */
export function FeatureCards({ block, className }: BlockProps<'featureCards'>) {
  return (
    <section id={block.anchor} className={`mx-auto grid max-w-[1440px] gap-5 px-5 lg:px-20 ${block.cards.length > 1 ? 'lg:grid-cols-2' : ''} ${className}`}>
      {block.cards.map((card) => (
        <div key={card.eyebrow} className="flex flex-col gap-4 rounded-3xl border border-line bg-paper p-7 lg:gap-5 lg:p-12">
          <Eyebrow>{card.eyebrow}</Eyebrow>
          {card.heading && <h2 className="font-display text-[36px] leading-none lg:text-[48px]">{card.heading}</h2>}
          {card.quote && <p className="font-display text-[30px] italic leading-tight text-deep lg:text-[40px]">{card.quote}</p>}
          {card.quoteSource && <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted">{card.quoteSource}</p>}
          <p className="text-[15.5px] leading-relaxed text-ink2 lg:text-lg lg:leading-[28px]">{card.text}</p>
        </div>
      ))}
    </section>
  );
}

/** "What comes next": numbered path steps, or paragraphs with a photo. */
export function Path({ block, className }: BlockProps<'path'>) {
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
      {block.paragraphs && (
        <div className={`grid items-center gap-8 ${block.image ? 'lg:grid-cols-[7fr_5fr] lg:gap-20' : ''}`}>
          <div className="flex flex-col gap-5">
            {block.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[1.6]">
                {p}
              </p>
            ))}
          </div>
          {block.image && (
            <Image
              src={block.image.src}
              alt={block.image.alt}
              width={block.image.width}
              height={block.image.height}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="aspect-[4/3] w-full rounded-3xl bg-deep object-cover"
            />
          )}
        </div>
      )}
      {block.steps && block.steps.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-3">
          {block.steps.map((step, i) => {
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
      )}
    </section>
  );
}

/** Heading + closing line on the left, a checklist on the right ("Rád is igazak az alábbiak?"). */
export function Checklist({ block, className }: BlockProps<'checklist'>) {
  return (
    <section id={block.anchor} className={`mx-auto grid max-w-[1440px] gap-8 px-5 lg:grid-cols-[5fr_7fr] lg:gap-20 lg:px-20 ${className}`}>
      <div className="flex flex-col gap-3.5 lg:gap-5">
        <Eyebrow>{block.eyebrow}</Eyebrow>
        <h2 className="font-display text-[42px] leading-[1.02] lg:text-[68px] lg:leading-none">
          <Emph text={block.heading} />
        </h2>
        <p className="font-display text-[28px] italic leading-tight text-rust lg:mt-4 lg:text-[36px]">{block.closing}</p>
      </div>
      <ul className="flex flex-col border-b border-line">
        {block.items.map((item) => (
          <li key={item} className="flex items-start gap-4 border-t border-line py-4 lg:py-5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-deep">
              <CheckIcon />
            </span>
            <span className="text-[17px] leading-snug lg:text-xl lg:leading-[28px]">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Numbered step cards ("Hogyan tudok jelentkezni?"). */
export function Steps({ block, className }: BlockProps<'steps'>) {
  return (
    <section id={block.anchor} className={`mx-auto flex max-w-[1440px] flex-col gap-7 px-5 lg:gap-12 lg:px-20 ${className}`}>
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {block.steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-3 rounded-3xl border border-line bg-paper p-6 lg:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal font-display text-2xl text-cream">{i + 1}</span>
            <h3 className="font-display text-[28px] leading-none lg:text-[32px]">{step.title}</h3>
            <p className="leading-relaxed text-ink2">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Sand band with a YouTube video ("Érdekel, milyen nálunk a hangulat?"). */
export function MoodVideo({ block, className }: BlockProps<'moodVideo'>) {
  return (
    <section id={block.anchor} className={`bg-sand ${className}`}>
      <div className="mx-auto grid max-w-[1440px] items-center gap-6 px-5 py-16 lg:grid-cols-[5fr_7fr] lg:gap-[72px] lg:px-20 lg:py-[120px]">
        <div className="flex flex-col gap-5 lg:gap-7">
          <Eyebrow>{block.eyebrow}</Eyebrow>
          <h2 className="font-display text-[42px] leading-[1.02] lg:text-[76px] lg:leading-none">
            <Emph text={block.heading} />
          </h2>
          <p className="hidden text-[19px] leading-relaxed text-ink2 lg:block">{block.text}</p>
          <ArrowLink link={block.link} className="hidden lg:inline-flex" />
        </div>
        <VideoEmbed youtubeId={block.video.youtubeId} title={block.video.title} />
        <ArrowLink link={block.link} className="lg:hidden" />
      </div>
    </section>
  );
}

/** Full-width photo (on the homepage it sits directly on the footer). */
export function FullImage({ block, className }: BlockProps<'fullImage'>) {
  return (
    <figure id={block.anchor} className={`relative ${className}`}>
      <Image src={block.image.src} alt={block.image.alt} width={block.image.width} height={block.image.height} sizes="100vw" className="h-[320px] w-full object-cover lg:h-[640px]" />
    </figure>
  );
}

/** A line of text with a button, between two rules ("Kövess minket…"). */
export function SocialBand({ block, className }: BlockProps<'socialBand'>) {
  return (
    <section id={block.anchor} className={`mx-auto max-w-[1440px] px-5 lg:px-20 ${className}`}>
      <div className="flex flex-col gap-4 border-y border-line py-8 sm:flex-row sm:items-center sm:justify-between lg:py-10">
        <p className="font-display text-[30px] leading-tight lg:text-[40px]">{block.heading}</p>
        <ButtonLink link={block.link} variant="outline" arrow className="self-start sm:self-auto" />
      </div>
    </section>
  );
}
