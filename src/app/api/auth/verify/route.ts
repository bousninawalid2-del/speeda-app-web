import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse } from '@/lib/auth-guard';
import { EMAIL_VERIFICATION_CODE_TTL_MS } from '@/lib/auth-constants';
import { issueTokens } from '../login/route';

const verifySchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
});

const resendSchema = z.object({
  userId: z.string(),
});

/** POST /api/auth/verify — verify OTP code */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }
    const { userId, code } = parsed.data;

    const record = await prisma.verifyToken.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return errorResponse('Invalid or expired verification code', 400);
    }

    // Mark token used and activate user
    await prisma.$transaction([
      prisma.verifyToken.update({ where: { id: record.id }, data: { used: true } }),
      prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
    ]);

    // Complete referral and award tokens to both parties
    const pendingReferral = await prisma.referral.findUnique({
      where: { refereeId: userId },
    });
    if (pendingReferral && pendingReferral.status === 'pending') {
      const reward = pendingReferral.tokensAwarded;
      await prisma.$transaction([
        prisma.referral.update({
          where: { id: pendingReferral.id },
          data: { status: 'completed' },
        }),
        // Award tokens to referrer
        prisma.user.update({
          where: { id: pendingReferral.referrerId },
          data: { tokenBalance: { increment: reward } },
        }),
        // Award tokens to new user (referee)
        prisma.user.update({
          where: { id: userId },
          data: { tokenBalance: { increment: reward } },
        }),
      ]);
    }

    // Auto-login after verification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return issueTokens(user!);
  } catch (err) {
    console.error('[verify]', err);
    return errorResponse('Internal server error', 500);
  }
}

/** PUT /api/auth/verify — resend OTP */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
    const { userId } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return errorResponse('User not found', 404);
    if (user.isVerified) return errorResponse('Account already verified');

    // Rate limit: check if a valid code was sent in the last 60s
    const recent = await prisma.verifyToken.findFirst({
      where: {
        userId,
        used: false,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recent) {
      return errorResponse('Please wait 60 seconds before requesting a new code', 429);
    }

    const { generateOTP } = await import('@/lib/auth-guard');
    const { sendVerificationEmail } = await import('@/lib/email');
    const code = generateOTP();
    await prisma.verifyToken.create({
      data: { code, userId, expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS) },
    });
    sendVerificationEmail(user.email, user.name ?? '', code).catch(console.error);

    return NextResponse.json({ message: 'Verification code sent' });
  } catch (err) {
    console.error('[verify resend]', err);
    return errorResponse('Internal server error', 500);
  }
}
