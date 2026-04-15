import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, requireAuth } from '@/lib/auth-guard';
import { regenerateDiscussionCodeForUser } from '@/lib/discussion-code';
import { toUserIdBigInt, toUserIdString } from '@/lib/user-id';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ 'id-user': string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const resolvedParams = await params;
    const userId = resolvedParams['id-user']?.trim();

    if (!userId) {
      return errorResponse('Missing userId route parameter', 400);
    }
    const routeUserId = toUserIdBigInt(userId);
    const authUserId = toUserIdBigInt(auth.user.sub);
    if (routeUserId !== authUserId) {
      return errorResponse('Forbidden', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: routeUserId },
      select: { id: true, isVerified: true },
    });
    if (!user) {
      return errorResponse('User not found', 404);
    }
    if (!user.isVerified) {
      return errorResponse('Account not verified', 403);
    }

    const discussionCode = await regenerateDiscussionCodeForUser(routeUserId);

    return NextResponse.json(
      { userId: toUserIdString(discussionCode.userId), code: discussionCode.code, key: discussionCode.key },
      { status: 200 }
    );
  } catch (err) {
    console.error('[discussioncode regenerate]', err);
    return errorResponse('Internal server error', 500);
  }
}
