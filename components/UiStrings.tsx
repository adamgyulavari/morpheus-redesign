'use client';

/**
 * The UI dictionary (content/ui.json) for client components. The root layout loads it on the server
 * and provides it once; interactive components read their labels with `useUi()`. Server components
 * call `getUi()` from the data layer instead.
 */
import { createContext, useContext, type ReactNode } from 'react';

import type { UiStrings } from '@/lib/types';

const UiContext = createContext<UiStrings | null>(null);

export function UiProvider({ ui, children }: { ui: UiStrings; children: ReactNode }) {
  return <UiContext.Provider value={ui}>{children}</UiContext.Provider>;
}

export function useUi(): UiStrings {
  const ui = useContext(UiContext);
  if (!ui) throw new Error('useUi() must be used inside <UiProvider>');
  return ui;
}
