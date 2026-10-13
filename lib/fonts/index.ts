/**
 * The site's fonts, for the frontend and the admin. The files are the Latin + Latin Extended subsets
 * of the Google Fonts originals (OFL, licences alongside), served by next/font from this site, so
 * neither the build nor visitors depend on Google. Each exposes a CSS variable for the @theme in
 * app/(frontend)/globals.css.
 */
import localFont from 'next/font/local';

export const figtree = localFont({
  src: './Figtree.woff2',
  weight: '300 900',
  variable: '--font-figtree',
  display: 'swap',
});

export const instrumentSerif = localFont({
  src: [
    { path: './InstrumentSerif-Regular.woff2', weight: '400', style: 'normal' },
    { path: './InstrumentSerif-Italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
