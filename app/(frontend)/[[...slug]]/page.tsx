import type { Metadata } from 'next';

import RenderBlocks from '@/components/blocks';
import MinimalLayout from '@/components/layouts/MinimalLayout';
import SiteLayout from '@/components/layouts/SiteLayout';
import RepertoireFilter from '@/components/RepertoireFilter';
import { getPage, getSiteSettings } from '@/lib/data';
import { redirectOrNotFound } from '@/lib/not-found';
import { pageMetadata } from '@/lib/seo';
import type { Page } from '@/lib/types';

/**
 * Every content page is rendered here from its data: the Pages collection gives the route, the
 * frame (site / minimal) and an ordered list of blocks. Any other path follows a redirect
 * (Átirányítások, e.g. the previous site's addresses) or is a 404. (Production pages have their
 * own template under /repertoar/[slug].)
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
  const path = pathOf((await params).slug);
  const [page, settings] = await Promise.all([getPage(path), getSiteSettings()]);
  if (!page) return {};
  const { meta } = page;
  return pageMetadata({
    title: meta.title || `${page.title} — ${settings.name}`,
    description: meta.description,
    image: meta.image,
    path,
    siteName: settings.name,
  });
}

/** The repertoire filter state is shared by the hero chips and the production sections. */
const needsRepertoireFilter = (page: Page) =>
  page.blocks.some((b) => b.blockType === 'repertoire' || (b.blockType === 'pageHero' && b.repertoireFilter));

export default async function ContentPage({ params }: Props) {
  const path = pathOf((await params).slug);
  const page = await getPage(path);
  if (!page) return redirectOrNotFound(path);

  const Layout = page.layout === 'minimal' ? MinimalLayout : SiteLayout;
  const blocks = <RenderBlocks blocks={page.blocks} layout={page.layout} ctx={{ path }} />;
  return (
    <Layout>
      {/* which document this is, for the staff edit overlay (components/edit) */}
      <span hidden data-cms-doc={`pages/${page.id}`} />
      {needsRepertoireFilter(page) ? <RepertoireFilter>{blocks}</RepertoireFilter> : blocks}
    </Layout>
  );
}
