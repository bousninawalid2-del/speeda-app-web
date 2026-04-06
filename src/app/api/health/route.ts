import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/health — liveness + readiness probe for Docker/Kubernetes */
export async function GET() {
  try {
    // Verify DB is reachable
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
