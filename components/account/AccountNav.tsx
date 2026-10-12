'use client';

/**
 * The account area's bar: its tabs, then the admin link (staff) and sign-out. Phase 3 adds
 * "Foglalásaim" (paid bookings) and "Számláim" (invoices) between "Teremfoglalás" and "Adataim".
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CalendarIcon, GearIcon, HomeIcon, LogoutIcon, PersonIcon } from '@/components/icons';
import { logout } from '@/lib/account-actions';

export default function AccountNav({ canBook, isStaff }: { canBook: boolean; isStaff: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/fiokom', label: 'Áttekintés', Icon: HomeIcon },
    ...(canBook ? [{ href: '/fiokom/terem', label: 'Teremfoglalás', Icon: CalendarIcon }] : []),
    { href: '/fiokom/adatok', label: 'Adataim', Icon: PersonIcon },
  ];
  return (
    <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
      <nav aria-label="Fiók" className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={pathname === t.href ? 'page' : undefined}
            className="chip"
          >
            <t.Icon className="h-[18px] w-[18px]" />
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 gap-2 pl-4">
        {isStaff && (
          <a href="/admin" className="chip">
            <GearIcon className="h-[18px] w-[18px]" />
            Admin felület
          </a>
        )}
        <form action={logout}>
          <button type="submit" className="chip">
            <LogoutIcon className="h-[18px] w-[18px]" />
            Kilépés
          </button>
        </form>
      </div>
    </div>
  );
}
