import { Fragment, type ReactNode } from 'react';

/**
 * A UI text's rich parts (ICU-style tags, payload/ui-catalogue.ts): `<link>…</link>` and the like,
 * each tag drawn by the caller, so the text never carries an address or markup of its own.
 */
export function tagged(text: string, tags: Record<string, (chunk: string) => ReactNode>): ReactNode {
  return text.split(/(<(\w+)>.*?<\/\2>)/).map((part, i) => {
    // split's captures: the whole tag at i, its name at i + 1 (skipped)
    if (i % 3 === 2) return null;
    const m = /^<(\w+)>(.*)<\/\1>$/.exec(part);
    const draw = m && tags[m[1] as string];
    // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one fixed text
    return <Fragment key={i}>{draw ? draw(m[2] as string) : (m?.[2] ?? part)}</Fragment>;
  });
}
