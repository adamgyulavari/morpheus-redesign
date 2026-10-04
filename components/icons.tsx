/** Inline stroke icons, all decorative (aria-hidden). */
type IconProps = { className?: string };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function ArrowRight({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={2} {...stroke} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={2} {...stroke} aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={2.2} {...stroke} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function MenuIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={2} {...stroke} aria-hidden="true">
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}

export function CheckIcon({ className = 'h-5 w-5 shrink-0' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={2.4} {...stroke} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function PersonIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={1.6} {...stroke} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function PlayIcon({ className = 'h-7 w-7 lg:h-9 lg:w-9' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

/** Contact icons take an explicit stroke colour (gold on dark cards, rust on light ones). */
type ColourIconProps = IconProps & { colour: string };

export function PhoneIcon({ colour, className = 'h-[22px] w-[22px] shrink-0' }: ColourIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} stroke={colour} aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

export function MailIcon({ colour, className = 'h-[22px] w-[22px] shrink-0' }: ColourIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} stroke={colour} aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

export function PinIcon({ colour, className = 'h-[22px] w-[22px] shrink-0' }: ColourIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} stroke={colour} aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function FacebookIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
    </svg>
  );
}

export function InstagramIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
