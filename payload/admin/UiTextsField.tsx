'use client';

/**
 * The `texts` JSON of a Felületi szövegek document as a form: the catalogue's tabs and groups, an
 * input per text. In another language each input shows the Hungarian text as its placeholder (a
 * blank one falls back to it on the site).
 */
import { TextareaInput, TextInput, useField, useFormFields } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import { textAt, UI_TABS, type UiSpec } from '../ui-catalogue';

type Tree = Record<string, unknown>;

const withText = (tree: Tree, path: string[], value: string): Tree => {
  const [key, ...rest] = path as [string, ...string[]];
  return { ...tree, [key]: rest.length ? withText((tree[key] as Tree) ?? {}, rest, value) : value };
};

export function UiTextsField({ path }: { path: string }) {
  const { value, setValue } = useField<Tree>({ path });
  const lang = useFormFields(([fields]) => fields.lang?.value as string | undefined);
  const [tab, setTab] = useState(0);
  const [base, setBase] = useState<Tree | null>(null);

  // another language: the base language's texts as the placeholders
  useEffect(() => {
    if (!lang || lang === 'hu') return setBase(null);
    fetch('/api/uiTexts?where[lang][equals]=hu&depth=0&limit=1', { credentials: 'include' })
      .then((r) => r.json())
      .then((r) => setBase(r.docs?.[0]?.texts ?? null))
      .catch(() => setBase(null));
  }, [lang]);

  const texts = value ?? {};
  const inputs = (spec: UiSpec, at: string[] = []) =>
    Object.entries(spec).map(([key, v]) => {
      const p = [...at, key];
      if (Array.isArray(v))
        return (
          <fieldset key={key} style={{ border: '1px solid var(--theme-elevation-100)', borderRadius: 4, padding: 16 }}>
            <legend style={{ padding: '0 6px', fontWeight: 600 }}>{v[0]}</legend>
            <div style={{ display: 'grid', gap: 16 }}>{inputs(v[1], p)}</div>
          </fieldset>
        );
      const props = {
        path: `${path}.${p.join('.')}`,
        label: typeof v === 'string' ? v : (v as { long: string }).long,
        value: textAt(texts, p) ?? '',
        placeholder: textAt(base, p),
        onChange: (e: { target: { value: string } }) => setValue(withText(texts, p, e.target.value)),
      };
      return typeof v === 'string' ? (
        <TextInput key={key} {...props} />
      ) : (
        <TextareaInput key={key} {...props} rows={3} />
      );
    });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {UI_TABS.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {UI_TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              className={`btn btn--size-small ${i === tab ? 'btn--style-primary' : 'btn--style-secondary'}`}
              onClick={() => setTab(i)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {inputs(UI_TABS[tab]?.spec ?? {})}
    </div>
  );
}
