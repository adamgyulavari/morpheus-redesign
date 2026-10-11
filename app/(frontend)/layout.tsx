import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { Figtree, Instrument_Serif } from 'next/font/google';
import type { ReactNode } from 'react';

import EditMode from '@/components/edit/EditMode';
import LivePreviewListener from '@/components/LivePreviewListener';
import { UiProvider } from '@/components/UiStrings';
import { getSiteSettings, getUi } from '@/lib/data';
import { serverUrl } from '@/lib/env';
import { robots } from '@/lib/seo';

import './globals.css';

// next/font downloads the fonts at build time and serves them from this site (no request to
// Google at runtime). Each exposes a CSS variable that the @theme in globals.css picks up.
const figtree = Figtree({ subsets: ['latin', 'latin-ext'], variable: '--font-figtree', display: 'swap' });
const instrumentSerif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

// Fallback only; every page sets its own title and description (from its content).
// metadataBase makes relative image URLs (Open Graph) absolute; read at runtime, not inlined.
export async function generateMetadata(): Promise<Metadata> {
  const base = serverUrl();
  return { title: (await getSiteSettings()).name, metadataBase: base ? new URL(base) : undefined, robots };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [ui, draft] = await Promise.all([getUi(), draftMode()]);
  return (
    <html lang="hu" className={`${figtree.variable} ${instrumentSerif.variable}`}>
      <body className="bg-cream font-sans text-ink antialiased">
        {/* an editor's preview from the admin: show drafts, refresh on every save */}
        {draft.isEnabled && <LivePreviewListener />}
        <UiProvider ui={ui}>{children}</UiProvider>
        {/* edit buttons for staff (decided in the browser; visitors only get the check) */}
        <EditMode />
      </body>
    </html>
  );
}
