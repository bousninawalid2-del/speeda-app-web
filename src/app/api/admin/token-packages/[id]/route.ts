import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

/** PUT /api/admin/token-packages/[id] — update token package */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const body = await req.json();
    const pkg = await prisma.tokenPackage.update({
      where: { id },
      data: {
        name: body.name,
        tokenCount: body.tokenCount,
        price: body.price,
        active: body.active,
        sortOrder: body.sortOrder,
      },
    });
    return NextResponse.json({ package: pkg });
  } catch (err) {
    console.error('[admin/token-packages/id PUT]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
