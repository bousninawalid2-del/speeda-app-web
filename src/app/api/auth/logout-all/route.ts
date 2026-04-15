import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { toUserIdBigInt } from '@/lib/user-id';
import { verifyRefreshToken } from '@/lib/jwt';

/**
 * POST /api/auth/logout-all
 * Revokes all refresh tokens for the current user except the current device token when available.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = toUserIdBigInt(auth.user.sub);

    const refreshToken = request.cookies.get('speeda_refresh')?.value;
    let currentTokenId: string | null = null;

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        currentTokenId = payload.jti;
      } catch {
        currentTokenId = null;
      }
    }

    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        ...(currentTokenId ? { token: { not: currentTokenId } } : {}),
      },
    });

    return NextResponse.json({ message: 'All other sessions have been signed out.' });
  } catch (err) {
    console.error('[logout-all]', err);
    return errorResponse('Internal server error', 500);
  }
}
