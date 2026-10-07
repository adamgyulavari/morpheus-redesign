import Logo from '@/components/Logo';

/** Login page: the Morpheus logo and name instead of Payload's. */
export function AdminLogo() {
  return (
    <div className="morpheus-logo">
      <Logo title={null} />
      <span className="morpheus-logo__name">
        Morpheus <em>Színműhely</em>
      </span>
      <span className="morpheus-logo__sub">Szerkesztőfelület</span>
    </div>
  );
}

/** Small logo in the sidebar / header. */
export function AdminIcon() {
  return <Logo title="Morpheus Színműhely" className="morpheus-icon" />;
}
