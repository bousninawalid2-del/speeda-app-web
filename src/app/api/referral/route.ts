import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * GET /api/referral
 * Returns the current user's referral code, URL, and list of referred users.
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, referralCode: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Generate and persist referral code if missing
  let referralCode = user.referralCode;
  if (!referralCode) {
    referralCode = crypto.randomBytes(4).toString('hex'); // 8 char hex
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const referralUrl = `${appUrl}/onboarding?ref=${referralCode}`;

  // Fetch referrals sent by this user
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referee: { select: { name: true, email: true, isVerified: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const friends = referrals.map(r => ({
    name: r.referee.name ?? r.referee.email,
    status: r.status as 'pending' | 'completed',
    tokens: r.tokensAwarded,
    createdAt: r.createdAt,
  }));

  const completedCount = friends.filter(f => f.status === 'completed').length;

  return NextResponse.json({
    referralCode,
    referralUrl,
    totalInvited: friends.length,
    totalSignedUp: completedCount,
    totalTokens: completedCount * 50,
    friends,
  });
}
