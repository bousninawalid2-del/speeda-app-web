import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, requireAuth } from '@/lib/auth-guard';
import { toUserIdBigInt } from '@/lib/user-id';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = toUserIdBigInt(auth.user.sub);
    const { id } = await params;
    const recordId = BigInt(id);

    const row = await prisma.postrapide.findUnique({ where: { id: recordId }, select: { userId: true } });
    if (!row) return errorResponse('Not found', 404);
    if (row.userId !== userId) return errorResponse('Forbidden', 403);

    await prisma.postrapide.delete({ where: { id: recordId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[postrapide delete]', err);
    return errorResponse('Internal server error', 500);
  }
}
