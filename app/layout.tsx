import type { Metadata } from 'next';
import { Figtree, Instrument_Serif } from 'next/font/google';
import type { ReactNode } from 'react';

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

// Fallback only; every page sets its own title and description (see generateMetadata in each page).
export const metadata: Metadata = {
  title: 'Morpheus Színműhely',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hu" className={`${figtree.variable} ${instrumentSerif.variable}`}>
      <body className="bg-cream font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
