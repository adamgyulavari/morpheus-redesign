import { getUi } from '@/lib/data';

import { FacebookIcon, InstagramIcon } from './icons';

/** Facebook + Instagram icon links (URLs from site settings). */
export default async function SocialLinks({ facebook, instagram, className = '' }: { facebook: string; instagram: string; className?: string }) {
  const ui = await getUi();
  const link = 'inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-current transition-colors hover:text-[var(--link-hover)]';
  return (
    <div className={`flex gap-3 ${className}`}>
      <a href={facebook} aria-label={ui.common.facebook} className={link}>
        <FacebookIcon />
      </a>
      <a href={instagram} aria-label={ui.common.instagram} className={link}>
        <InstagramIcon />
      </a>
    </div>
  );
}
