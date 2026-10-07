import type { DefaultNodeTypes, SerializedHeadingNode } from '@payloadcms/richtext-lexical';
import { type JSXConvertersFunction, RichText } from '@payloadcms/richtext-lexical/react';

import { getLegalPage, getUi } from '@/lib/data';
import { slugify } from '@/lib/slugify';

import type { BlockProps } from './types';

type TextNode = { text?: string; children?: TextNode[] };
const plainText = (node: TextNode): string => node.text ?? (node.children ?? []).map(plainText).join('');

const converters: JSXConvertersFunction<DefaultNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const id = slugify(plainText(node as unknown as TextNode));
    const children = nodesToJSX({ nodes: node.children });
    return node.tag === 'h2' ? (
      <h2 id={id} className="mb-4 mt-12 scroll-mt-28 font-display text-[32px] leading-tight text-ink first:mt-0 lg:text-[40px]">
        {children}
      </h2>
    ) : (
      <h3 id={id} className="mb-3 mt-8 scroll-mt-28 text-lg font-bold leading-snug text-ink lg:text-xl">
        {children}
      </h3>
    );
  },
  paragraph: ({ node, nodesToJSX }) => <p className="mb-4">{nodesToJSX({ nodes: node.children })}</p>,
});

/** A legal document (rich text from the CMS) with its title and a sticky table of contents. */
export async function LegalDocument({ block, className }: BlockProps<'legalDocument'>) {
  const [ui, doc] = await Promise.all([getUi(), getLegalPage(block.document)]);
  const toc = (doc.content.root.children as unknown as SerializedHeadingNode[])
    .filter((n) => n.type === 'heading' && n.tag === 'h2')
    .map((n) => {
      const text = plainText(n as unknown as TextNode);
      return { id: slugify(text), text };
    });
  return (
    <section
      id={block.anchor}
      className={`mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 pt-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,8fr)] lg:gap-16 lg:px-20 lg:pb-[120px] lg:pt-16 ${className}`}
    >
      <h1 className="font-display text-[48px] leading-[0.95] lg:col-span-2 lg:text-[96px]">{doc.title}</h1>
      <nav aria-label={ui.common.tocLabel} className="lg:sticky lg:top-32 lg:self-start">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal">{ui.common.toc}</span>
        <ol className="mt-3 flex flex-col gap-2 border-l-2 border-line pl-4 text-[15px]">
          {toc.map((h) => (
            <li key={h.id}>
              <a href={`#${h.id}`} className="link-nav text-ink2">
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="max-w-[70ch] text-[16.5px] leading-[1.7] text-ink2 lg:text-[17px] [&_a]:underline [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-bold [&_strong]:text-ink [&_table]:mb-4 [&_table]:w-full [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:p-2 [&_th]:text-left [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6">
        <RichText data={doc.content} converters={converters} disableContainer />
      </article>
    </section>
  );
}
