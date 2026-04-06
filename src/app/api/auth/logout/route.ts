import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { verifyRefreshToken } from '@/lib/jwt';

/**
 * POST /api/auth/logout
 * Reads the refresh token from the httpOnly cookie, revokes it in DB, and clears the cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const refreshToken = request.cookies.get('speeda_refresh')?.value;

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.refreshToken.deleteMany({ where: { token: payload.jti } });
      } catch {
        // Token invalid — nothing to revoke
      }
    }

    const response = NextResponse.json({ message: 'Logged out successfully.' });

    // Clear the httpOnly cookie
    response.cookies.set('speeda_refresh', '', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/api/auth',
      maxAge:   0,
    });

    return response;
  } catch (err) {
    console.error('[logout]', err);
    return errorResponse('Internal server error', 500);
  }
}
