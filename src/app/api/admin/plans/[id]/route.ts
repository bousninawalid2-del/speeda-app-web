import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

/** GET /api/admin/plans/[id] — get single plan */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    return NextResponse.json({ plan });
  } catch (err) {
    console.error('[admin/plans/id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT /api/admin/plans/[id] — update plan */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const body = await req.json();
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        monthlyPrice: body.monthlyPrice,
        yearlyPrice: body.yearlyPrice,
        tokenCount: body.tokenCount,
        platformLimit: body.platformLimit,
        features: body.features,
        locked: body.locked,
        active: body.active,
      },
    });
    return NextResponse.json({ plan });
  } catch (err) {
    console.error('[admin/plans/id PUT]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
