import 'server-only';

import { getCourse, getUi } from '@/lib/data';
import { priceSummary } from '@/lib/format';
import type { Fact } from '@/lib/types';

/** Facts with their values filled in (`coursePrice` → "140 000 Ft-tól"). */
export async function resolveFacts(facts: Fact[]): Promise<{ label: string; value: string; href?: string }[]> {
  const from = (await getUi()).course.priceFrom;
  return Promise.all(
    facts.map(async (f) => ({
      label: f.label,
      value: f.coursePrice ? priceSummary((await getCourse(f.coursePrice)).prices, from) : (f.value ?? ''),
      href: f.href,
    })),
  );
}
