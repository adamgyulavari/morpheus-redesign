'use client';

import type { ReactNode } from 'react';

import { figtree, instrumentSerif } from '@/lib/fonts';

/** Admin provider: sets Payload's body font and a display font for headings (used in custom.scss). */
export function AdminTheme({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`:root{--font-body:${figtree.style.fontFamily},'Segoe UI',system-ui,sans-serif;--font-display:${instrumentSerif.style.fontFamily},'Times New Roman',serif}`}</style>
      {children}
    </>
  );
}
