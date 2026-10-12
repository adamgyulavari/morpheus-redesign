'use client';

/**
 * Tabs of the account area. Phase 3 adds "Foglalásaim" (paid bookings) and "Számláim" (invoices)
 * here, between "Teremfoglalás" and "Adataim".
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AccountNav({ active }: { active: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/fiokom', label: 'Áttekintés' },
    ...(active ? [{ href: '/fiokom/terem', label: 'Teremfoglalás' }] : []),
    { href: '/fiokom/adatok', label: 'Adataim' },
  ];
  return (
    <nav aria-label="Fiók" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={pathname === t.href ? 'page' : undefined}
          className="chip aria-[current=page]:border-teal aria-[current=page]:bg-teal aria-[current=page]:text-cream"
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
