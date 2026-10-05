import { Fragment } from 'react';

import { getLegalPage, getUi } from '@/lib/data';
import { parseMarkdown, type Inline } from '@/lib/markdown';

import type { BlockProps } from './types';

const Content = ({ content }: { content: Inline[] }) =>
  content.map((c, i) => ('br' in c ? <br key={i} /> : c.bold ? <strong key={i}>{c.text}</strong> : <Fragment key={i}>{c.text}</Fragment>));

/** A legal document (Markdown, verbatim) with its title and a sticky table of contents. */
export async function LegalDocument({ block, className }: BlockProps<'legalDocument'>) {
  const [ui, { markdown }] = await Promise.all([getUi(), getLegalPage(block.document)]);
  const blocks = parseMarkdown(markdown);
  const title = blocks.find((b) => b.type === 'heading' && b.level === 1);
  const toc = blocks.filter((b) => b.type === 'heading' && b.level === 2);
  return (
    <section
      id={block.anchor}
      className={`mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 pt-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,8fr)] lg:gap-16 lg:px-20 lg:pb-[120px] lg:pt-16 ${className}`}
    >
      <h1 className="font-display text-[48px] leading-[0.95] lg:col-span-2 lg:text-[96px]">{title?.type === 'heading' ? title.text : ''}</h1>
      <nav aria-label={ui.common.tocLabel} className="lg:sticky lg:top-32 lg:self-start">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal">{ui.common.toc}</span>
        <ol className="mt-3 flex flex-col gap-2 border-l-2 border-line pl-4 text-[15px]">
          {toc.map((h) =>
            h.type === 'heading' ? (
              <li key={h.id}>
                <a href={`#${h.id}`} className="link-nav text-ink2">
                  {h.text}
                </a>
              </li>
            ) : null,
          )}
        </ol>
      </nav>
      <article className="max-w-[70ch] text-[16.5px] leading-[1.7] text-ink2 lg:text-[17px]">
        {blocks.map((b, i) => {
          if (b.type === 'heading') {
            if (b.level === 1) return null;
            return b.level === 2 ? (
              <h2 key={i} id={b.id} className="mb-4 mt-12 scroll-mt-28 font-display text-[32px] leading-tight text-ink first:mt-0 lg:text-[40px]">
                {b.text}
              </h2>
            ) : (
              <h3 key={i} id={b.id} className="mb-3 mt-8 scroll-mt-28 text-lg font-bold leading-snug text-ink lg:text-xl">
                {b.text}
              </h3>
            );
          }
          return (
            <p key={i} className="mb-4 [&_strong]:font-bold [&_strong]:text-ink">
              <Content content={b.content} />
            </p>
          );
        })}
      </article>
    </section>
  );
}
