'use client';

/**
 * Repertoire filter "Mind / Társulati előadások / Hallgatói előadások".
 * The chips live in the hero and the sections further down, so the state is shared through a small
 * context: <RepertoireFilter> wraps the page, <FilterChips> renders the buttons, <FilterGroup> wraps
 * each server-rendered section and hides it when filtered out. Only the state is client-side; the
 * cards inside stay server components (passed through as children).
 */
import { createContext, useContext, useState, type ReactNode } from 'react';

import type { ProductionGroup } from '@/lib/types';

import { useUi } from './UiStrings';

type Filter = 'all' | ProductionGroup;
const FilterContext = createContext<{ filter: Filter; setFilter: (f: Filter) => void } | null>(null);

function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('Repertoire filter components must be inside <RepertoireFilter>');
  return ctx;
}

export default function RepertoireFilter({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<Filter>('all');
  return <FilterContext.Provider value={{ filter, setFilter }}>{children}</FilterContext.Provider>;
}

/** The chips; `counts` = number of productions per chip. */
export function FilterChips({ counts }: { counts: Record<Filter, number> }) {
  const { filter, setFilter } = useFilter();
  const labels = useUi().repertoire;
  const chips = (['all', 'company', 'students'] as const).map((value) => ({ value, label: labels[value], count: counts[value] }));
  return (
    <div
      role="group"
      aria-label={labels.filter}
      className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:mt-2 lg:flex-wrap lg:overflow-visible lg:px-0"
    >
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          aria-pressed={filter === chip.value}
          onClick={() => setFilter(chip.value)}
          className="chip group"
        >
          {chip.label}
          <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-sand px-1.5 text-[13px] font-bold text-deep group-aria-pressed:bg-gold">
            {chip.count}
          </span>
        </button>
      ))}
    </div>
  );
}

export function FilterGroup({ group, id, className, children }: { group: ProductionGroup; id?: string; className: string; children: ReactNode }) {
  const { filter } = useFilter();
  return (
    <section id={id} className={className} hidden={filter !== 'all' && filter !== group}>
      {children}
    </section>
  );
}
