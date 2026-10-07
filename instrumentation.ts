/**
 * Runs once when the Next.js server starts. Initialising Payload here (instead of on the first
 * request) runs pending database migrations at container start-up (`prodMigrations` in
 * payload.config.ts) and starts the scheduled jobs.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const [{ getPayload }, { default: config }] = await Promise.all([import('payload'), import('@payload-config')]);
  await getPayload({ config });
}
