/**
 * instrumentation.ts
 *
 * Next.js instrumentation hook — runs once when the Node.js server starts.
 * Starts the PostgreSQL LISTEN/NOTIFY listener that keeps Speeda in sync with
 * the n8n "datatest" database (datatest → Speeda direction).
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPgListener } = await import('./src/lib/pg-listener');
    startPgListener();
  }
}
