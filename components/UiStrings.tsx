'use client';

/**
 * The UI texts (Felületi szövegek) for client components, by tab (payload/ui-catalogue.ts): the
 * root layout provides the site's, AccountShell adds the account and checkout pages'. Interactive
 * components read them with `useUi()`; server components call `getUi()` from the data layer.
 */
import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { UiStrings } from '@/lib/types';

const UiContext = createContext<UiStrings | null>(null);

/** `ui`: some tabs' groups, added to what an outer provider gives. */
export function UiProvider({ ui, children }: { ui: Partial<UiStrings>; children: ReactNode }) {
  const outer = useContext(UiContext);
  const value = useMemo(() => ({ ...outer, ...ui }) as UiStrings, [outer, ui]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

/** The dictionary, or null outside <UiProvider> (e.g. components also used in the admin). */
export function useUiOptional(): UiStrings | null {
  return useContext(UiContext);
}

export function useUi(): UiStrings {
  const ui = useContext(UiContext);
  if (!ui) throw new Error('useUi() must be used inside <UiProvider>');
  return ui;
}
