'use client';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';

/** In the admin's live preview: re-renders the page whenever the editor's draft is saved. */
export default function LivePreviewListener() {
  const router = useRouter();
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={typeof window === 'undefined' ? '' : window.location.origin} />;
}
