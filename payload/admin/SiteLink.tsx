/** In the admin header, on every page: back to the website. */
export function SiteLink() {
  return (
    <a
      href="/"
      style={{
        color: 'var(--theme-text)',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        padding: '6px 12px',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      ← Weboldal
    </a>
  );
}
