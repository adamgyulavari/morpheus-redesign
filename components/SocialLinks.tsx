import { FacebookIcon, InstagramIcon } from './icons';

/** Facebook + Instagram icon links (URLs from site settings). */
export default function SocialLinks({ facebook, instagram, className = '' }: { facebook: string; instagram: string; className?: string }) {
  const link = 'inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-current transition-colors hover:text-[var(--link-hover)]';
  return (
    <div className={`flex gap-3 ${className}`}>
      <a href={facebook} aria-label="A Morpheus Színműhely Facebook-oldala" className={link}>
        <FacebookIcon />
      </a>
      <a href={instagram} aria-label="A Morpheus Színműhely Instagram-oldala" className={link}>
        <InstagramIcon />
      </a>
    </div>
  );
}
