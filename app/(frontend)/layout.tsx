import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import type { ReactNode } from 'react';

import EditMode from '@/components/edit/EditMode';
import LivePreviewListener from '@/components/LivePreviewListener';
import { UiProvider } from '@/components/UiStrings';
import { getSiteSettings, getUi } from '@/lib/data';
import { serverUrl } from '@/lib/env';
import { figtree, instrumentSerif } from '@/lib/fonts';
import { robots } from '@/lib/seo';
import { uiTab } from '@/payload/ui-catalogue';

import './globals.css';

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
        <UiProvider ui={uiTab(ui, 'site')}>{children}</UiProvider>
        {/* edit buttons for staff (decided in the browser; visitors only get the check) */}
        <EditMode />
      </body>
    </html>
  );
}
