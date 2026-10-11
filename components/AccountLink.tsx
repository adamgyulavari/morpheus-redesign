'use client';

/**
 * "Belépés" / "Fiókom" in the header. The pages are cached and the same for everyone, so the
 * login state is read in the browser, from the hint cookie set at login (payload/session.ts) —
 * re-checked after every navigation (login and logout redirect).
 */
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PersonIcon } from './icons';
import NavLink from './NavLink';

const SIGNED_IN_COOKIE = 'morpheus-signed-in';
const AUTH_PAGES = ['/regisztracio', '/elfelejtett-jelszo', '/jelszo-visszaallitas', '/email-megerosites'];

export default function AccountLink({
  className,
  labelClassName = '',
  onNavigate,
}: {
  className?: string;
  /** e.g. visually hide the label (icon only) where the header is tight */
  labelClassName?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setSignedIn(document.cookie.split('; ').some((c) => c.startsWith(`${SIGNED_IN_COOKIE}=`)));
  }, [pathname]);

  return (
    <NavLink href={signedIn ? '/fiokom' : '/belepes'} match={signedIn ? undefined : AUTH_PAGES} className={className} onNavigate={onNavigate}>
      <PersonIcon className="h-[18px] w-[18px]" />
      <span className={`link-nav ${labelClassName}`}>{signedIn ? 'Fiókom' : 'Belépés'}</span>
    </NavLink>
  );
}
