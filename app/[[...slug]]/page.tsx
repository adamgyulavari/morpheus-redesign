import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import RenderBlocks from '@/components/blocks';
import MinimalLayout from '@/components/layouts/MinimalLayout';
import SiteLayout from '@/components/layouts/SiteLayout';
import RepertoireFilter from '@/components/RepertoireFilter';
import { getPage, getPages } from '@/lib/data';
import type { Page } from '@/lib/types';

/**
 * Every content page is rendered here from its data: the Pages collection gives the route, the
 * frame (site / minimal) and an ordered list of blocks. Only the pages in the collection exist
 * (generated at build time); any other path is a 404. (Production pages have their own template
 * under /repertoar/[slug].)
 *
 * Regenerated at most once a day (ISR), so dated items (shows, course starts, sessions…) drop off
 * without a redeploy.
 */
export const dynamicParams = false;
export const revalidate = 86400;

type Props = { params: Promise<{ slug?: string[] }> };

const pathOf = (slug?: string[]) => `/${(slug ?? []).join('/')}`;

export async function generateStaticParams() {
  return (await getPages()).map((page) => ({ slug: page.path === '/' ? [] : page.path.slice(1).split('/') }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage(pathOf((await params).slug));
  return page ? { title: page.meta.title, description: page.meta.description } : {};
}

/** The repertoire filter state is shared by the hero chips and the production sections. */
const needsRepertoireFilter = (page: Page) =>
  page.blocks.some((b) => b.blockType === 'repertoire' || (b.blockType === 'pageHero' && b.repertoireFilter));

export default async function ContentPage({ params }: Props) {
  const path = pathOf((await params).slug);
  const page = await getPage(path);
  if (!page) notFound();

  let content = <RenderBlocks blocks={page.blocks} layout={page.layout} ctx={{ path }} />;
  if (needsRepertoireFilter(page)) content = <RepertoireFilter>{content}</RepertoireFilter>;

  return page.layout === 'minimal' ? <MinimalLayout>{content}</MinimalLayout> : <SiteLayout>{content}</SiteLayout>;
}
