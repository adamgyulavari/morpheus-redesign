/**
 * Minimal Markdown parser for the legal pages: # / ## / ### headings, paragraphs, **bold**,
 * hard line breaks ("  \n") and backslash escapes. That is everything those documents use, so no
 * dependency is needed; anything else is kept as plain text.
 */
export type Inline = { text: string; bold?: boolean } | { br: true };
export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; id: string; text: string }
  | { type: 'paragraph'; content: Inline[] };

const unescape = (s: string) => s.replace(/\\([\\`*_{}[\]()#+\-.!>])/g, '$1');

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inline(src: string): Inline[] {
  const out: Inline[] = [];
  src.split(/ {2}\n/).forEach((line, li) => {
    if (li > 0) out.push({ br: true });
    line.split(/\*\*(.+?)\*\*/).forEach((part, i) => {
      if (part) out.push({ text: unescape(part.replace(/\n/g, ' ')), ...(i % 2 === 1 ? { bold: true } : {}) });
    });
  });
  return out;
}

export function parseMarkdown(md: string): Block[] {
  return md
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trimEnd())
    .filter(Boolean)
    .map((chunk): Block => {
      const h = chunk.match(/^(#{1,3}) (.+)$/);
      if (h) {
        const text = unescape(h[2]!.trim());
        return { type: 'heading', level: h[1]!.length as 1 | 2 | 3, id: slugify(text), text };
      }
      return { type: 'paragraph', content: inline(chunk) };
    });
}
