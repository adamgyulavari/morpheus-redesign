/** SQL pieces shared by the counts (server.ts) and the capacity lock (the Applications collection). */
import { sql } from '@payloadcms/db-postgres';

import { COUNTED_STATUSES } from './rules';

/** The row takes a place now (rules.ts `takesPlace`): paid, or awaiting payment within its hold. */
export const TAKES_PLACE = sql`(status = 'registered' OR (status = 'held' AND hold_until > now()))`;

/** The row counts toward the minimum (rules.ts COUNTED_STATUSES). */
export const IS_PAID = sql`status IN (${sql.join(
  COUNTED_STATUSES.map((s) => sql`${s}`),
  sql`, `,
)})`;

/** `a, b, c` for an IN (…) list. */
export const inList = (list: readonly (string | number)[]) =>
  sql.join(
    list.map((s) => sql`${s}`),
    sql`, `,
  );
