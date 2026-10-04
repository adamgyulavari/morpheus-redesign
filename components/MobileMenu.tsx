'use client';

/**
 * Hamburger toggle + the slide-down menu below the header bar (hidden from 1280px, where the
 * inline nav takes over). Client component: it holds the open state.
 */
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

import type { Link, NavItem } from '@/lib/types';

import { MenuIcon } from './icons';
import NavLink from './NavLink';

export default function MobileMenu({ nav, cta }: { nav: NavItem[]; cta: Link }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const pathname = usePathname();

  // Close the menu after navigating to another page.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        className="btn-icon xl:hidden"
        aria-label={open ? 'Menü bezárása' : 'Menü megnyitása'}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <MenuIcon />
      </button>
      <nav
        id={menuId}
        aria-label="Főmenü"
        hidden={!open}
        className="absolute inset-x-0 top-full border-t border-line bg-cream px-5 pb-6 lg:px-20 xl:hidden"
      >
        {nav.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            match={item.match}
            className="flex min-h-[48px] items-center border-b border-line text-lg font-medium"
            onNavigate={() => setOpen(false)}
          >
            <span className="link-nav">{item.label}</span>
          </NavLink>
        ))}
        <NavLink href={cta.href} className="btn btn-lg btn-primary mt-5 w-full" onNavigate={() => setOpen(false)}>
          {cta.label}
        </NavLink>
      </nav>
    </>
  );
}
