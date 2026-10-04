import { Fragment } from 'react';

/**
 * Renders a heading string where *asterisks* mark the emphasised part, e.g. "Így látják a *Morpheust.*".
 * The emphasis colour depends on the surface: rust on light backgrounds, gold on dark ones.
 */
export default function Emph({ text, dark = false }: { text: string; dark?: boolean }) {
  const parts = text.split(/\*([^*]+)\*/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className={dark ? 'text-gold' : 'text-rust'}>
            {part}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
