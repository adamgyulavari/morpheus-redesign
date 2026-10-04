/**
 * Image loader for the static (GitHub Pages) build: no optimisation server, so images are served
 * as they are. Local paths get the base path (/<repo>) in front; remote URLs pass through.
 * The width goes into the URL fragment — never sent to the server — only to satisfy next/image.
 */
export default function imageLoader({ src, width }: { src: string; width: number }): string {
  const url = src.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${src}` : src;
  return `${url}#w=${width}`;
}
