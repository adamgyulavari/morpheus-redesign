'use client';

import { Figtree, Instrument_Serif } from 'next/font/google';
import type { ReactNode } from 'react';

// The site's fonts, self-hosted by next/font (no request to Google at runtime), for the admin.
const figtree = Figtree({ subsets: ['latin', 'latin-ext'], display: 'swap' });
const instrumentSerif = Instrument_Serif({ subsets: ['latin', 'latin-ext'], weight: '400', display: 'swap' });

/** Admin provider: sets Payload's body font and a display font for headings (used in custom.scss). */
export function AdminTheme({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`:root{--font-body:${figtree.style.fontFamily},'Segoe UI',system-ui,sans-serif;--font-display:${instrumentSerif.style.fontFamily},'Times New Roman',serif}`}</style>
      {children}
    </>
  );
}
