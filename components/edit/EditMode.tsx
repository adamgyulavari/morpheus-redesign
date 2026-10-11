'use client';

/**
 * Staff edit overlay loader. The pages are cached and the same for everyone, so whether to show
 * edit buttons is decided here, in the browser, from the "signed in" hint cookie (`staff`, set at
 * login — payload/session.ts). Visitors only download this check; the overlay itself is a
 * separate chunk loaded for staff. Not shown inside the admin's live preview.
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const EditOverlay = dynamic(() => import('./EditOverlay'), { ssr: false });

export default function EditMode() {
  const [staff, setStaff] = useState(false);
  useEffect(() => {
    setStaff(window.top === window.self && document.cookie.split('; ').includes('morpheus-signed-in=staff'));
  }, []);
  return staff ? <EditOverlay /> : null;
}
