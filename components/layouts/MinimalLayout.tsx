import type { ReactNode } from 'react';

/** Standalone narrow column without header and footer (the link-in-bio page). */
export default function MinimalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col items-center gap-7 overflow-hidden px-5 pb-10 pt-12">
      <div className="sun absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-90" aria-hidden="true" />
      {children}
    </main>
  );
}
