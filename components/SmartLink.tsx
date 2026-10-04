import Link from 'next/link';
import type { ComponentProps } from 'react';

/**
 * Site routes ("/kapcsolat", "/nyitott-alkalmak#idopontok") go through next/link for client-side
 * navigation and prefetching; external URLs, mailto:, tel: and same-page "#anchor" links stay plain <a>.
 */
export default function SmartLink({ href, ...rest }: Omit<ComponentProps<'a'>, 'href'> & { href: string }) {
  if (href.startsWith('/')) return <Link href={href} {...rest} />;
  return <a href={href} {...rest} />;
}
