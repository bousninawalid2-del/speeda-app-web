import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/** PUT /api/auth/change-password — change password (requires auth) */
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser || !dbUser.password) {
      return errorResponse('Account uses passwordless login', 400);
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) return errorResponse('Current password is incorrect', 401);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.sub }, data: { password: hashed } });

    // Revoke all existing refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId: user.sub } });

    return NextResponse.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[change-password]', err);
    return errorResponse('Internal server error', 500);
  }
}
