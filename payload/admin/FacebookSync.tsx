'use client';

/**
 * Above the Előadás-időpontok list: "Szinkronizálás a Facebookról" — the page's upcoming events
 * become dates (lib/facebook/sync). Says what changed, and what needs a person.
 */
import { Button } from '@payloadcms/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { syncFacebookAction } from '@/lib/facebook/actions';
import type { SyncLine, SyncResult } from '@/lib/facebook/sync';

const box = {
  margin: '0 0 24px',
  padding: '16px 20px',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 8,
  background: 'var(--theme-elevation-50)',
} as const;
const muted = { color: 'var(--theme-elevation-500)' } as const;

function Lines({ title, lines, tone }: { title: string; lines: SyncLine[]; tone?: string }) {
  if (!lines.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <strong style={{ color: tone }}>
        {title} ({lines.length})
      </strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {lines.map((l) => (
          <li key={`${l.link}${l.when}`} style={{ marginBottom: 4 }}>
            {l.showId ? <a href={`/admin/collections/shows/${l.showId}`}>{l.name}</a> : l.name}{' '}
            <span style={muted}>· {l.when}</span>{' '}
            <a href={l.link} target="_blank" rel="noopener" style={muted}>
              (Facebook)
            </a>
            {l.note && <div style={{ whiteSpace: 'pre-line', ...(tone ? { color: tone } : muted) }}>{l.note}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FacebookSync() {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = () =>
    start(async () => {
      setError('');
      const r = await syncFacebookAction();
      if (!r.ok) return setError(r.reason);
      setResult(r.result);
      router.refresh();
    });
  const nothing =
    result &&
    !result.created.length &&
    !result.updated.length &&
    !result.hidden.length &&
    !result.problems.length &&
    !result.rooms.length;
  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Button buttonStyle="primary" size="medium" margin={false} disabled={pending} onClick={run}>
          {pending ? 'Szinkronizálás…' : 'Szinkronizálás a Facebookról'}
        </Button>
        <span style={muted}>
          A Facebook-oldal közelgő eseményei ide kerülnek: az előadás a címéből, a helyszín a nevéből; az időpont, a
          helyszín és a jegylink a Facebookot követi.
        </span>
      </div>
      {error && <p style={{ margin: '12px 0 0', color: 'var(--theme-error-500)' }}>{error}</p>}
      {result && (
        <div>
          {nothing && <p style={{ margin: '12px 0 0' }}>Minden naprakész ({result.unchanged} időpont).</p>}
          <Lines title="Új időpont" lines={result.created} />
          <Lines title="Frissítve" lines={result.updated} />
          <Lines title="Elrejtve" lines={result.hidden} />
          <Lines title="Nézd meg — nem mentettük" lines={result.problems} tone="var(--theme-warning-500, #d9822b)" />
          <Lines
            title="A termek miatt lemondva — egyeztess, akit kell"
            lines={result.rooms}
            tone="var(--theme-warning-500, #d9822b)"
          />
          {!nothing && result.unchanged > 0 && (
            <p style={{ margin: '12px 0 0', ...muted }}>Változatlan: {result.unchanged}.</p>
          )}
        </div>
      )}
    </div>
  );
}
