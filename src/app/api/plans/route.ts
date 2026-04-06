import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/plans — public, returns active plans ordered by price */
export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({
    plans: plans.map(p => ({
      ...p,
      features: JSON.parse(p.features),
      locked:   JSON.parse(p.locked),
    })),
  });
}
