import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

/** GET /api/admin/plans — list all plans */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
    return NextResponse.json({ plans });
  } catch (err) {
    console.error('[admin/plans]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
