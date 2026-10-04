import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';

import Gallery from '@/components/Gallery';
import { ArrowLeft, ArrowRight } from '@/components/icons';
import ShowRow from '@/components/ShowRow';
import { CtaBand, Eyebrow, SectionHeading } from '@/components/ui';
import VideoEmbed from '@/components/VideoEmbed';
import { getPageContent, getProduction, getProductionsWithDetailPage, getShowsForProduction } from '@/lib/data';
import { dayOfMonth, monthLong, weekday } from '@/lib/dates';

// Only productions with `detailPage: true` get a page; every one is generated at build time
// (required for the static export), and any other slug is a 404.
export const dynamicParams = false;
export const revalidate = 86400;

export async function generateStaticParams() {
  return (await getProductionsWithDetailPage()).map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const firstSentence = (text: string) => (text.match(/^.*?[.!?…](?=\s|$)/)?.[0] ?? text).trim();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduction((await params).slug);
  if (!p) return {};
  const title = `${p.title} — Morpheus Színműhely`;
  const description = firstSentence(p.longDescription[0] ?? p.summary);
  return { title, description, openGraph: { title, description, images: [{ url: p.poster.src, width: p.poster.width, height: p.poster.height, alt: p.poster.alt }] } };
}

/** Paragraphs that are a line of dialogue („…”) are set as pull quotes. */
const isQuote = (text: string) => /^„[^„]+”$/.test(text.trim());

/** Button to the dates list further down the page. */
function DatesCta({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <a href="#idopontok" className={`btn btn-lg self-stretch sm:self-start ${dark ? 'btn-gold' : 'btn-primary'}`}>
      {label}
      <ArrowRight />
    </a>
  );
}

const youtubeId = (url: string) => url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];

/** Paragraph text where "\n" marks a line break. */
const Lines = ({ text }: { text: string }) =>
  text.split('\n').map((line, i, all) => (
    <Fragment key={i}>
      {line}
      {i < all.length - 1 && <br />}
    </Fragment>
  ));

export default async function ProductionPage({ params }: Props) {
  const p = await getProduction((await params).slug);
  if (!p?.detailPage) notFound();
  const [{ detail }, shows] = await Promise.all([getPageContent('repertoar'), getShowsForProduction(p.id)]);
  const { labels } = detail;
  const next = shows[0];
  const action = (s: (typeof shows)[number]) =>
    s.ticketUrl ? { label: labels.ticket, href: s.ticketUrl } : s.registrationUrl ? { label: labels.registration, href: s.registrationUrl } : undefined;
  const nextAction = next && action(next);
  const video = p.videoUrl && youtubeId(p.videoUrl);
  const named = p.cast.some((c) => c.role);
  const bg = p.heroImage ?? p.gallery?.[0] ?? p.poster;
  // The heading is the story's opening line, so it's not repeated at the start of the text:
  // "Két ex-szerelmes … találkozik: a sikeres…" → "…a sikeres…"; an identical paragraph is dropped.
  const story = (() => {
    const head = p.descriptionHeading?.replace(/…$/, '').trim();
    const [first, ...rest] = p.longDescription;
    if (!head || !first?.startsWith(head)) return p.longDescription;
    const remainder = first.slice(head.length).replace(/^[\s:,.?!…]+/, '');
    return remainder ? [`…${remainder}`, ...rest] : rest;
  })();
  const bgIsPoster = bg === p.poster;

  return (
    <>
      {/* HERO — full-bleed image (or the poster, blurred) under a dark veil, with the next-date card */}
      <section className="on-dark relative isolate overflow-hidden bg-night text-cream">
        <Image
          src={bg.src}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className={`-z-10 object-cover ${bgIsPoster ? 'scale-110 blur-2xl' : 'object-top'}`}
        />
        {p.heroVideo && (
          // decorative loop over the still frame; hidden when the visitor prefers reduced motion
          <video
            className="absolute inset-0 -z-10 h-full w-full object-cover motion-reduce:hidden"
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${p.heroVideo}`}
            poster={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${bg.src}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night/90 via-night/75 to-night/45" aria-hidden="true" />
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-14 pt-16 lg:min-h-[560px] lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-end lg:gap-16 lg:px-20 lg:pb-20 lg:pt-28">
          <div className="flex flex-col gap-5 lg:gap-7">
            <Eyebrow dark>{[p.genre, p.byline].filter(Boolean).join(' · ')}</Eyebrow>
            <h1 className="font-display text-[60px] leading-[0.95] lg:text-[128px] lg:leading-[0.88]">{p.title}</h1>
            {p.tagline && <p className="max-w-[620px] font-display text-[26px] italic leading-snug text-gold lg:text-[34px]">{p.tagline}</p>}
            {p.credits.length > 0 && (
              <div className="flex flex-wrap gap-x-7 gap-y-1.5 text-[15px] text-mist lg:text-[17px]">
                {p.credits.map((c) => (
                  <span key={c.label}>
                    {c.label}: <span className="font-semibold text-cream">{c.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          {next ? (
            <div className="flex flex-col gap-4 rounded-3xl bg-paper p-6 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] lg:p-8">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-rust-dark">{labels.nextShow}</span>
              <div className="flex items-center gap-4">
                <span className="font-display text-[64px] leading-none text-rust">{dayOfMonth(next.date)}</span>
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold">
                    {monthLong(next.date)}, {weekday(next.date)}
                  </span>
                  <span className="text-lg font-semibold">{next.time}</span>
                </span>
              </div>
              <span className="text-[15px] text-ink2">{next.venue.name}</span>
              {nextAction && (
                <a href={nextAction.href} className="btn btn-lg btn-primary">
                  {nextAction.label}
                  <ArrowRight />
                </a>
              )}
              {shows.length > 1 && (
                <a href="#idopontok" className="link self-center text-[15px] font-semibold text-teal">
                  {labels.ctaDates}
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-3xl border border-cream/25 bg-night/40 p-6 backdrop-blur-sm lg:p-8">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{labels.nextShow}</span>
              <p className="text-lg leading-snug">{labels.noDates}</p>
              <Link href={detail.upcomingLink.href} className="btn btn-md btn-outline-cream self-start">
                {detail.upcomingLink.label}
                <ArrowRight />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT — poster beside the story */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pt-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20 lg:px-20 lg:pt-[120px]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Image
            src={p.poster.src}
            alt={p.poster.alt}
            width={p.poster.width}
            height={p.poster.height}
            sizes="(min-width: 1024px) 30vw, 80vw"
            className="mx-auto aspect-[3/4] w-[62%] max-w-[420px] -rotate-[1.5deg] sm:w-full rounded-[22px] border-8 border-paper bg-deep object-cover shadow-[0_24px_48px_-24px_rgba(11,58,63,0.55)]"
          />
        </div>
        <div className="flex max-w-[720px] flex-col gap-6">
          <Eyebrow>{labels.about}</Eyebrow>
          {p.descriptionHeading && <h2 className="font-display text-[40px] leading-[1.02] lg:text-[60px] lg:leading-none">{p.descriptionHeading}</h2>}
          <div className="flex flex-col gap-5 text-[17px] leading-relaxed text-ink2 lg:text-[19px] lg:leading-[1.65]">
            {story.map((para, i) =>
              isQuote(para) ? (
                // a line of dialogue from the play becomes a pull quote
                <blockquote key={i} className="border-l-4 border-gold py-1 pl-5 font-display text-[28px] italic leading-snug text-deep lg:text-[36px]">
                  {para}
                </blockquote>
              ) : (
                <p key={i} className={i === 0 ? 'text-[19px] text-ink lg:text-[22px] lg:leading-[1.55]' : undefined}>
                  <Lines text={para} />
                </p>
              ),
            )}
            {p.note && <p className="text-sm text-muted">{p.note}</p>}
          </div>
          {shows.length > 0 && <DatesCta label={labels.ctaDates} />}

          {/* CAST — still beside the poster */}
          <div className="mt-6 flex flex-col gap-5 border-t border-line pt-8 lg:mt-10 lg:pt-10">
            <h2 className="font-display text-[36px] leading-none lg:text-[48px]">{p.castLabel}</h2>
            {named ? (
              <dl className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3 lg:gap-x-8">
                {p.cast.map((c, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <dt className="font-display text-[19px] italic leading-tight text-deep lg:text-[21px]">
                      {c.role}
                      {c.roleNote && <span className="block font-sans text-xs not-italic text-muted">{c.roleNote}</span>}
                    </dt>
                    <dd className="text-[15px] font-semibold leading-snug">
                      {c.names.map((name, k) => (
                        <Fragment key={name}>
                          {k > 0 && <span className="font-normal text-muted"> / </span>}
                          <span className="whitespace-nowrap">{name}</span>
                        </Fragment>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <ul className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
                {p.cast.map((c) => (
                  <li key={c.names.join('/')} className="text-[15px] font-semibold">
                    {c.names.join(' / ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS — compact band */}
      {p.highlights && p.highlights.length > 0 && (
        <section className="on-dark relative mt-16 overflow-hidden bg-deep text-cream lg:mt-[120px]">
          <div className="sun absolute -right-24 -top-28 h-52 w-52 rounded-full opacity-90 lg:-right-28 lg:-top-36 lg:h-[300px] lg:w-[300px]" aria-hidden="true" />
          <div className="relative mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-12 lg:gap-10 lg:px-20 lg:py-16">
            <h2 className="font-display text-[36px] leading-[1.02] lg:text-[52px] lg:leading-none">{labels.highlights}</h2>
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {p.highlights.map((h, i) => (
                <div key={h.title} className="flex gap-4 border-t border-[#2b5a5e] pt-4">
                  <span className="font-display text-[28px] leading-none text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-lg font-semibold leading-tight">{h.title}</h3>
                    <p className="text-[15px] leading-relaxed text-mist">{h.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {shows.length > 0 && <DatesCta label={labels.ctaBook} dark />}
          </div>
        </section>
      )}

      {/* INVITATION — e.g. the director's personal recommendation (plays with sound, on request) */}
      {p.inviteVideo && (
        <section className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 pt-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20 lg:px-20 lg:pt-[120px]">
          <div className="flex flex-col gap-5 lg:gap-7">
            <Eyebrow>{p.inviteVideo.title}</Eyebrow>
            <h2 className="font-display text-[40px] leading-[1.02] lg:text-[64px] lg:leading-none">{labels.invite}</h2>
            {shows.length > 0 && <DatesCta label={labels.ctaBook} />}
          </div>
          <video
            className="aspect-square w-full max-w-[520px] justify-self-center rounded-3xl bg-deep shadow-[0_24px_48px_-24px_rgba(11,58,63,0.55)]"
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${p.inviteVideo.src}`}
            poster={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${p.inviteVideo.poster.src}`}
            controls
            playsInline
            preload="none"
            aria-label={p.inviteVideo.title}
          />
        </section>
      )}

      {/* AUDIENCE QUOTES — note cards like the reviews */}
      {p.audienceQuotes && p.audienceQuotes.length > 0 && (
        <section className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
          <h2 className="text-center font-display text-[40px] leading-none lg:text-[64px]">{labels.quotes}</h2>
          {/* fixed-width cards, centred; the sand panel shrinks to fit however many there are */}
          <div className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-6 rounded-[32px] lg:gap-8 lg:bg-sand lg:p-10">
            {p.audienceQuotes.map((q, i) => (
              <figure
                key={i}
                className={`relative flex w-full flex-col gap-4 rounded-[18px] px-6 pb-6 pt-7 sm:w-[320px] lg:w-[340px] shadow-[0_16px_30px_-20px_rgba(11,58,63,0.55)] ${
                  ['-rotate-[1.2deg] border border-line bg-paper', 'rotate-[1deg] bg-[#d3e7e3]', '-rotate-[0.6deg] bg-[#fbe3b0]'][i % 3]
                }`}
              >
                <span className={`absolute -top-[11px] left-1/2 h-[22px] w-[86px] -translate-x-1/2 ${['-rotate-3 bg-[#f9c86a]/75', 'rotate-3 bg-[#e0603a]/45', '-rotate-2 bg-white/60'][i % 3]}`} aria-hidden="true" />
                <blockquote className="font-display text-[22px] leading-[1.22] lg:text-[24px]">„{q.text}”</blockquote>
                {q.author && <figcaption className="mt-auto text-sm font-bold">{q.author}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* VIDEO */}
      {video && (
        <section className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
          <h2 className="text-center font-display text-[40px] leading-none lg:text-[64px]">{labels.video}</h2>
          <div className="mx-auto w-full max-w-[1000px]">
            <VideoEmbed youtubeId={video} title={p.title} />
          </div>
        </section>
      )}

      {/* GALLERY */}
      {p.gallery && p.gallery.length > 0 && (
        <section className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 pt-16 lg:gap-12 lg:px-20 lg:pt-[120px]">
          <h2 className="font-display text-[40px] leading-none lg:text-[64px]">{labels.gallery}</h2>
          <Gallery images={p.gallery} label={`${p.title} — képek`} />
          {shows.length > 0 && <DatesCta label={labels.ctaConvinced} />}
        </section>
      )}

      {/* DATES */}
      <section id="idopontok" className="mx-auto flex max-w-[1440px] scroll-mt-28 flex-col gap-6 px-5 pt-16 lg:gap-10 lg:px-20 lg:pt-[120px]">
        <SectionHeading eyebrow={p.title} heading={labels.dates} />
        {shows.length === 0 ? (
          <p className="border-y border-line py-8 text-[17px] text-ink2 lg:text-xl">{labels.noDates}</p>
        ) : (
          <div className="flex flex-col">
            {shows.map((show, i) => (
              <ShowRow key={show.id} show={show} ticketLabel={labels.ticket} registrationLabel={labels.registration} last={i === shows.length - 1} />
            ))}
          </div>
        )}
        <Link href={detail.backLink.href} className="link link-arrow self-start text-base text-teal lg:text-[17px]">
          <ArrowLeft className="h-[18px] w-[18px]" />
          {detail.backLink.label}
        </Link>
      </section>

      <CtaBand {...detail.cta} />
    </>
  );
}
