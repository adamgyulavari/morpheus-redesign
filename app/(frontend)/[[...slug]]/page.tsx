import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import RenderBlocks from '@/components/blocks';
import MinimalLayout from '@/components/layouts/MinimalLayout';
import SiteLayout from '@/components/layouts/SiteLayout';
import RepertoireFilter from '@/components/RepertoireFilter';
import { getPage } from '@/lib/data';
import type { Page } from '@/lib/types';

/**
 * Every content page is rendered here from its data: the Pages collection gives the route, the
 * frame (site / minimal) and an ordered list of blocks. Any path that isn't in the collection is a
 * 404. (Production pages have their own template under /repertoar/[slug].)
 *
 * Nothing is rendered at build time (the build has no database). Each page renders on its first
 * request and is then cached (ISR); saving in the admin revalidates the affected pages, and the
 * hourly `revalidateDates` job re-renders date-dependent ones. `revalidate` is a daily safety net.
 */
export const revalidate = 86400;

type Props = { params: Promise<{ slug?: string[] }> };

const pathOf = (slug?: string[]) => `/${(slug ?? []).join('/')}`;

/** Empty: pages are rendered on demand, then cached. (Its presence is what makes them cacheable.) */
export function generateStaticParams() {
  return [];
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
