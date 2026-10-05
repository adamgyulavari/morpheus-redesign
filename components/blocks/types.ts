import type { BlockOf, BlockType } from '@/lib/types';

/** What a block may need to know about the page it is on. */
export type BlockContext = { path: string };

/** Props of every block component: its data, the spacing classes for its root element, and the page context. */
export type BlockProps<T extends BlockType> = { block: BlockOf<T>; className: string; ctx: BlockContext };
