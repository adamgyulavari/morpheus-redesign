import type { Metadata } from 'next';

import { getSiteSettings } from '@/lib/data';

/** Account pages: own title, never indexed. */
export async function accountMetadata(title: string): Promise<Metadata> {
  const { name } = await getSiteSettings();
  return { title: `${title} — ${name}`, robots: { index: false, follow: false } };
}
