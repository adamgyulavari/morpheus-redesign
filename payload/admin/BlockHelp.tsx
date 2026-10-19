import type { UIFieldServerProps } from 'payload';

/**
 * A short explanation at the top of a page block in the admin (what the block shows, where its data
 * comes from), with links to the collections it lists (`lists` in payload/blocks), e.g. "Oktatók →".
 * The links open in a new tab, so the page being edited stays as it is.
 */
export function BlockHelp({ field, payload }: UIFieldServerProps) {
  const { text, lists = [] } = (field.admin?.custom ?? {}) as { text?: string; lists?: string[] };
  const links = lists.flatMap((slug) => {
    const plural = payload.collections[slug as keyof typeof payload.collections]?.config.labels.plural;
    return typeof plural === 'string'
      ? [{ href: `${payload.config.routes.admin}/collections/${slug}`, label: plural }]
      : [];
  });
  if (!text && !links.length) return null;
  return (
    <p style={{ margin: '0 0 1rem', color: 'var(--theme-elevation-500)', fontSize: '13px' }}>
      {text}
      {links.length > 0 && (
        <>
          {text && ' '}
          Szerkesztés:{' '}
          {links.map((l, i) => (
            <span key={l.href}>
              {i > 0 && ', '}
              <a
                href={l.href}
                target="_blank"
                rel="noopener"
                style={{ color: 'var(--theme-text)', textDecoration: 'underline' }}
              >
                {l.label}
              </a>
            </span>
          ))}{' '}
          →
        </>
      )}
    </p>
  );
}
