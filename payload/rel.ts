/** Relationship values as Payload hands them over: an id, a populated doc, or nothing. */
export type Rel = number | { id: number } | null | undefined;

/** The id of a relationship value (populated or not). */
export const relId = (v: unknown): number | null =>
  v == null ? null : typeof v === 'object' ? Number((v as { id: number }).id) : Number(v);

/** The ids of a hasMany relationship value. */
export const relIds = (v: unknown): number[] =>
  Array.isArray(v) ? v.map(relId).filter((x): x is number => x !== null) : [];
