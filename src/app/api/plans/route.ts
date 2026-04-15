import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/plans — public, returns active plans ordered by sortOrder */
export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      monthlyPrice: true,
      yearlyPrice: true,
      tokenCount: true,
      platformLimit: true,
      features: true,
      locked: true,
      watermark: true,
      popular: true,
      sortOrder: true,
    },
  });

  return NextResponse.json({
    plans: plans.map(p => ({
      id: p.id,
      name: p.name,
      monthlyPrice: p.monthlyPrice,
      yearlyPrice: p.yearlyPrice,
      tokenCount: p.tokenCount,
      platformLimit: p.platformLimit,
      features: (() => {
        try {
          const parsed = JSON.parse(p.features);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
      locked: (() => {
        try {
          const parsed = JSON.parse(p.locked);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
      watermark: p.watermark,
      popular: p.popular,
      sortOrder: p.sortOrder,
    })),
  });
}
