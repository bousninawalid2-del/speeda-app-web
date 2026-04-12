import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

/** GET /api/token-packages — list active token packs for purchase */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const packs = await prisma.tokenPackage.findMany({
    where: { active: true, tokenCount: { gt: 0 }, price: { gt: 0 } },
    orderBy: [{ sortOrder: 'asc' }, { tokenCount: 'asc' }],
    select: { id: true, name: true, tokenCount: true, price: true },
  });

  return NextResponse.json({ packs });
}
