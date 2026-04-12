import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

/** GET /api/admin/stats — global dashboard stats */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const [
      totalUsers,
      activeSubscriptions,
      recentUsers,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userSubscription.count({ where: { status: 'active' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          tokenBalance: true,
          trialEndsAt: true,
          role: true,
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'succeeded',
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
      recentUsers,
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
