import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/account/Card';

/** Instead of the checkout (paused, full, closed): why, then a way back. */
export default function CheckoutNotice({
  text,
  back,
  children,
}: {
  text: string;
  back: { href: string; label: string };
  /** Another way in, under the text. */
  children?: ReactNode;
}) {
  return (
    <Card className="max-w-[680px]">
      <p className="text-[17px]">{text}</p>
      {children}
      <Link href={back.href} className="link self-start font-semibold">
        {back.label}
      </Link>
    </Card>
  );
}
