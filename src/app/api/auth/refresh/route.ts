import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken, signAccessToken, signRefreshToken, expiresInMs } from '@/lib/jwt';
import { generateSecureToken, errorResponse } from '@/lib/auth-guard';

/**
 * POST /api/auth/refresh
 * Reads the refresh token from the httpOnly cookie (never from the request body).
 * Rotates the token: deletes the old DB record and issues a new one.
 * Returns a new access token in the JSON body.
 */
export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('speeda_refresh')?.value;
    if (!refreshToken) {
      return errorResponse('No refresh token', 401);
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return errorResponse('Invalid or expired refresh token', 401);
    }

    // Verify the token still exists in DB (not revoked)
    const record = await prisma.refreshToken.findUnique({ where: { token: payload.jti } });
    if (!record || record.expiresAt < new Date()) {
      return errorResponse('Refresh token revoked or expired', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return errorResponse('User not found', 404);

    // ── Rotate: delete old token, create new one ──────────────────────────────
    const newJti    = generateSecureToken();
    const newExpiry = new Date(Date.now() + expiresInMs(process.env.JWT_REFRESH_EXPIRES ?? '7d'));

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: payload.jti } }),
      prisma.refreshToken.create({
        data: { token: newJti, userId: user.id, expiresAt: newExpiry },
      }),
    ]);

    const accessToken    = signAccessToken({ sub: user.id, email: user.email, name: user.name ?? undefined });
    const newRefreshToken = signRefreshToken({ sub: user.id, jti: newJti });

    const response = NextResponse.json({ accessToken });

    response.cookies.set('speeda_refresh', newRefreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/api/auth',
      maxAge:   60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('[refresh]', err);
    return errorResponse('Internal server error', 500);
  }
}
