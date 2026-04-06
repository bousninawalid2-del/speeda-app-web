import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateSecureToken, errorResponse } from '@/lib/auth-guard';
import { sendPasswordResetEmail } from '@/lib/email';

const forgotSchema = z.object({ email: z.string().email() });

const resetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

/** POST /api/auth/reset-password — request a reset link */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    // Always respond OK to avoid email enumeration
    if (user) {
      const token = generateSecureToken();
      await prisma.resetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });
      sendPasswordResetEmail(user.email, user.name ?? '', token).catch(console.error);
    }

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgot-password]', err);
    return errorResponse('Internal server error', 500);
  }
}

/** PUT /api/auth/reset-password — set a new password using the reset token */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
    const { token, newPassword } = parsed.data;

    const record = await prisma.resetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      return errorResponse('Reset link is invalid or has expired', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.resetToken.update({ where: { id: record.id }, data: { used: true } }),
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[reset-password]', err);
    return errorResponse('Internal server error', 500);
  }
}
