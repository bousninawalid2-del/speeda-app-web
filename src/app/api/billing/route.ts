import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';

/**
 * GET /api/billing
 * Returns payment history for the current user.
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    payments: payments.map(p => ({
      id:          p.id,
      amount:      p.amount,
      currency:    p.currency,
      status:      p.status,
      type:        p.type,
      description: p.description,
      createdAt:   p.createdAt,
      metadata:    p.metadata ? JSON.parse(p.metadata) : null,
    })),
  });
}
