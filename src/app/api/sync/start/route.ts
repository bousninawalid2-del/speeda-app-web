/**
 * GET /api/sync/start
 *
 * Admin-only route to (re)start the PostgreSQL LISTEN/NOTIFY listener.
 * Secured by the ADMIN_SECRET environment variable.
 *
 * Useful for triggering the listener manually without a full server restart.
 */
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ??
                 req.nextUrl.searchParams.get('secret');

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { startPgListener } = await import('@/lib/pg-listener');
  startPgListener();

  return Response.json({ ok: true, message: 'pg-listener started' });
}
