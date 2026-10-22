import emblem from '@/logo-source/original-emblem.svg';

/**
 * The Morpheus logo: the original logo's round emblem (logo-source/original-emblem.svg, cut from
 * original-logo.svg without its lettering). An image, not inline: the file is large, and the browser
 * caches it once for the header and the footer. (The new logo animates in the hero: AnimatedLogo.)
 */
export default function Logo({
  className,
  title,
}: {
  className?: string;
  /** Accessible name (Felületi szövegek: common.logo); null when the logo is decorative next to the visible name. */
  title: string | null;
}) {
  return (
    // biome-ignore lint/performance/noImgElement: a static SVG; next/image adds nothing to it
    <img
      src={emblem.src}
      width={575}
      height={575}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      className={className}
    />
  );
}
