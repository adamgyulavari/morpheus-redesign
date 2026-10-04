'use client';

/**
 * Client component only because it needs the current URL (usePathname) to set aria-current.
 * It is used inside the server-rendered header, footer and mobile menu.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function NavLink({
  href,
  match,
  className,
  children,
  onNavigate,
}: {
  href: string;
  /** Extra routes on which this link counts as the current page. */
  match?: string[];
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const current = [href.split('#')[0], ...(match ?? [])].includes(pathname);
  return (
    <Link href={href} className={className} aria-current={current ? 'page' : undefined} onClick={onNavigate}>
      {children}
    </Link>
  );
}
