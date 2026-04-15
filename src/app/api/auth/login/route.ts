import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { signAccessToken, signRefreshToken, expiresInMs } from '@/lib/jwt';
import { generateSecureToken, errorResponse } from '@/lib/auth-guard';
import { toUserIdBigInt, toUserIdString } from '@/lib/user-id';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return errorResponse('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!user.isVerified) {
      return errorResponse('Please verify your email before logging in', 403);
    }

    return issueTokens(user, request);
  } catch (err) {
    console.error('[login]', err);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * Shared helper — create access + refresh token pair.
 * - Returns accessToken + user in JSON body (safe to read by JS)
 * - Sets refresh token as httpOnly, Secure cookie (JS cannot read it)
 */
export async function issueTokens(
  user: { id: bigint; email: string; name: string | null },
  _req?: NextRequest
) {
  const userId = toUserIdString(user.id);
  const refreshTokenId = generateSecureToken();
  const refreshExpiry = new Date(
    Date.now() + expiresInMs(process.env.JWT_REFRESH_EXPIRES ?? '7d')
  );

  // Persist refresh token in DB
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenId,
      userId: toUserIdBigInt(user.id),
      expiresAt: refreshExpiry,
    },
  });

  const accessToken = signAccessToken({
    sub: userId,
    email: user.email,
    name: user.name ?? undefined,
  });

  const refreshToken = signRefreshToken({ sub: userId, jti: refreshTokenId });

  const response = NextResponse.json({
    accessToken,
    user: { id: userId, email: user.email, name: user.name },
  });

  // Store refresh token in httpOnly cookie — JS cannot access it
  response.cookies.set('speeda_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',            // only sent to auth endpoints
    maxAge: 60 * 60 * 24 * 7,    // 7 days
  });

  return response;
}
