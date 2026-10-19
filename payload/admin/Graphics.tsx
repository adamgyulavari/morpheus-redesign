import SiteLogo from '@/components/Logo';

/** Login page: the Morpheus logo and name instead of Payload's. */
export function Logo() {
  return (
    <div className="morpheus-logo">
      <SiteLogo title={null} />
      <span className="morpheus-logo__name">
        Morpheus <em>Színműhely</em>
      </span>
      <span className="morpheus-logo__sub">Szerkesztőfelület</span>
    </div>
  );
}

/** Small logo in the sidebar / header. */
export function Icon() {
  return <SiteLogo title="Morpheus Színműhely" className="morpheus-icon" />;
}
