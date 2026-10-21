'use client';

/**
 * The account area's bar: its tabs, then the admin link (staff) and sign-out.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CalendarIcon, HomeIcon, LogoutIcon, PersonIcon, ReceiptIcon, WrenchIcon } from '@/components/icons';
import { useUi } from '@/components/UiStrings';
import { logout } from '@/lib/account-actions';

export default function AccountNav({ canBook, isStaff }: { canBook: boolean; isStaff: boolean }) {
  const pathname = usePathname();
  const t = useUi().nav;
  const tabs = [
    { href: '/fiokom', label: t.overview, Icon: HomeIcon },
    ...(canBook ? [{ href: '/fiokom/terem', label: t.rooms, Icon: CalendarIcon }] : []),
    { href: '/fiokom/szamlaim', label: t.invoices, Icon: ReceiptIcon },
    { href: '/fiokom/adatok', label: t.profile, Icon: PersonIcon },
  ];
  return (
    <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
      <nav aria-label={t.label} className="flex gap-2">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} aria-current={pathname === t.href ? 'page' : undefined} className="chip">
            <t.Icon className="h-[18px] w-[18px]" />
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 gap-2 pl-4">
        {isStaff && (
          <a href="/admin" className="chip">
            <WrenchIcon className="h-[18px] w-[18px]" />
            {t.admin}
          </a>
        )}
        <form action={logout}>
          <button type="submit" className="chip">
            <LogoutIcon className="h-[18px] w-[18px]" />
            {t.logout}
          </button>
        </form>
      </div>
    </div>
  );
}
