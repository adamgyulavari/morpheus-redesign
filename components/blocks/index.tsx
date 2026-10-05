/**
 * The block registry: every `blockType` of the Page model maps to one component. A page is rendered
 * by mapping its blocks through here, so adding a block type = a type in lib/types.ts + a component
 * registered below (+ the matching block config in the CMS).
 */
import type { ReactNode } from 'react';

import type { Block, BlockType, Page, Space } from '@/lib/types';

import { BioIntro, BioNextShow, ContactFooter, LinkList, SocialLinksBlock } from './bio';
import { CourseCompare, CoursePrices, CourseStarts, Offerings } from './courses';
import {
  Benefits,
  Checklist,
  CtaBandBlock,
  Curriculum,
  FeatureCards,
  FullImage,
  ImageText,
  LinkCards,
  MoodVideo,
  Path,
  Questions,
  SocialBand,
  Statement,
  Steps,
  TextSplit,
} from './editorial';
import { HomeHero, PageHeroBlock } from './heroes';
import { LegalDocument } from './legal';
import { ContactCard, ContactPeople, InstructorGrid, InstructorRow, Location, Programmes, QuoteRequest, Reviews } from './people';
import { NextShowBanner, Repertoire, UpcomingShows } from './shows';
import type { BlockContext, BlockProps } from './types';
import { OpenWorkshopSessions, PastWorkshops, UpcomingWorkshops } from './workshops';

const registry: { [T in BlockType]: (props: BlockProps<T>) => ReactNode | Promise<ReactNode> } = {
  homeHero: HomeHero,
  pageHero: PageHeroBlock,
  ctaBand: CtaBandBlock,
  textSplit: TextSplit,
  statement: Statement,
  imageText: ImageText,
  linkCards: LinkCards,
  questions: Questions,
  benefits: Benefits,
  curriculum: Curriculum,
  featureCards: FeatureCards,
  path: Path,
  checklist: Checklist,
  steps: Steps,
  moodVideo: MoodVideo,
  fullImage: FullImage,
  socialBand: SocialBand,
  offerings: Offerings,
  reviews: Reviews,
  instructorRow: InstructorRow,
  instructorGrid: InstructorGrid,
  upcomingShows: UpcomingShows,
  nextShowBanner: NextShowBanner,
  repertoire: Repertoire,
  contactCard: ContactCard,
  courseStarts: CourseStarts,
  coursePrices: CoursePrices,
  courseCompare: CourseCompare,
  upcomingWorkshops: UpcomingWorkshops,
  pastWorkshops: PastWorkshops,
  openWorkshopSessions: OpenWorkshopSessions,
  programmes: Programmes,
  quoteRequest: QuoteRequest,
  contactPeople: ContactPeople,
  location: Location,
  legalDocument: LegalDocument,
  bioIntro: BioIntro,
  bioNextShow: BioNextShow,
  linkList: LinkList,
  socialLinks: SocialLinksBlock,
  contactFooter: ContactFooter,
};

// Spacing is margin, so a block that renders nothing (e.g. no upcoming workshops) leaves no gap.
const TOP: Record<Space, string> = { none: '', xs: 'mt-6 lg:mt-12', sm: 'mt-10 lg:mt-16', md: 'mt-12 lg:mt-[88px]', lg: 'mt-16 lg:mt-[120px]' };
const BOTTOM: Record<Space, string> = { none: '', xs: 'mb-6 lg:mb-12', sm: 'mb-10 lg:mb-16', md: 'mb-12 lg:mb-[88px]', lg: 'mb-16 lg:mb-[120px]' };

/** Blocks that sit flush by default (heroes, the legal text, the link-in-bio column, which has its own gaps). */
const FLUSH = new Set<BlockType>(['homeHero', 'pageHero', 'legalDocument']);

function spacingClass(block: Block, layout: Page['layout']): string {
  const top = block.spacing?.top ?? (layout === 'minimal' || FLUSH.has(block.blockType) ? 'none' : 'lg');
  const bottom = block.spacing?.bottom ?? (block.blockType === 'ctaBand' && layout === 'site' ? 'lg' : 'none');
  // anchored sections stop below the sticky header when jumped to
  return [TOP[top], BOTTOM[bottom], block.anchor ? 'scroll-mt-36' : ''].filter(Boolean).join(' ');
}

export default function RenderBlocks({ blocks, layout, ctx }: { blocks: Block[]; layout: Page['layout']; ctx: BlockContext }) {
  return blocks.map((block, i) => {
    const Component = registry[block.blockType] as (props: BlockProps<BlockType>) => ReactNode | Promise<ReactNode>;
    return <Component key={`${block.blockType}-${i}`} block={block} className={spacingClass(block, layout)} ctx={ctx} />;
  });
}
