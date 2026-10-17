/** Raw SQL next to Payload's own queries — inside the request's transaction when there is one. */
import type { sql } from '@payloadcms/db-postgres';
import type { Payload, PayloadRequest } from 'payload';

type Row = Record<string, unknown>;
export type Executor = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: Row[] }> };

/** The Drizzle instance of the request's transaction (as Payload's own adapter does), else the pool. */
export async function dbOf(payload: Payload, req?: Partial<PayloadRequest>): Promise<Executor> {
  const adapter = payload.db as unknown as { drizzle: Executor; sessions?: Record<string, { db: Executor }> };
  const id = req?.transactionID ? await req.transactionID : undefined;
  return (id !== undefined && adapter.sessions?.[String(id)]?.db) || adapter.drizzle;
}
