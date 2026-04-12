import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

/** GET /api/admin/token-packages — list all token packages */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const packages = await prisma.tokenPackage.findMany({ orderBy: { sortOrder: 'asc' } });
    return NextResponse.json({ packages });
  } catch (err) {
    console.error('[admin/token-packages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/admin/token-packages — create a new token package */
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const pkg = await prisma.tokenPackage.create({
      data: {
        name: body.name,
        tokenCount: body.tokenCount,
        price: body.price,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (err) {
    console.error('[admin/token-packages POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
