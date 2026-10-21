/**
 * The server's messages (Felületi szövegek → Üzenetek). The pure rules (lib/rooms/rules.ts,
 * lib/applications/rules.ts) refuse with a text's key and its values; the server words them.
 */
import { fill } from './format';

export type Values = Record<string, string | number>;

/** A rule's no: which text of its group, and what fills the text's {placeholders}. */
export type Refusal<K extends string> = { ok: false; refusal: K; values?: Values };

/** A refusal in words, from its group's texts. */
export const say = <K extends string>(texts: Record<K, string>, r: Refusal<K>) =>
  fill(texts[r.refusal], r.values ?? {});

/** What the server answers the site: done, or why not in words. */
export type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: string };
