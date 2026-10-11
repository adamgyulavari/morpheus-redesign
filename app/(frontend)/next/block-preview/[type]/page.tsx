import { notFound } from 'next/navigation';

import RenderBlocks from '@/components/blocks';
import RepertoireFilter from '@/components/RepertoireFilter';
import { getPages } from '@/lib/data';
import type { Block } from '@/lib/types';

/**
 * Development only: renders the first block of a type found on the site, alone and without
 * spacing, for `npm run block-thumbnails` (the pictures in the admin's "add block" drawer).
 */
export const dynamic = 'force-dynamic';

export default async function BlockPreview({ params }: { params: Promise<{ type: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { type } = await params;
  const pages = await getPages();
  const page = pages.find((p) => p.blocks.some((b) => b.blockType === type));
  const found = page?.blocks.find((b) => b.blockType === type);
  if (!page || !found) notFound();

  const block = { ...found, spacing: { top: 'none', bottom: 'none' } } as Block;
  let content = <RenderBlocks blocks={[block]} layout={page.layout} ctx={{ path: page.path }} />;
  if (type === 'repertoire' || (block.blockType === 'pageHero' && block.repertoireFilter))
    content = <RepertoireFilter>{content}</RepertoireFilter>;
  // the link-in-bio blocks sit in their narrow column (without the full-height frame)
  return page.layout === 'minimal' ? (
    <div id="block-preview" className="mx-auto flex max-w-[480px] flex-col items-center gap-7 px-5 py-8">
      {content}
    </div>
  ) : (
    <main id="block-preview">{content}</main>
  );
}
