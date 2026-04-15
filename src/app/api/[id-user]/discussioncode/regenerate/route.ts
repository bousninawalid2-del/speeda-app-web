import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse } from '@/lib/auth-guard';
import { regenerateDiscussionCodeForUser } from '@/lib/discussion-code';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ 'id-user': string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams['id-user']?.trim();

    if (!userId) {
      return errorResponse('Missing userId route parameter', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const discussionCode = await regenerateDiscussionCodeForUser(userId);

    return NextResponse.json(
      { userId: discussionCode.userId, code: discussionCode.code, key: discussionCode.key },
      { status: 200 }
    );
  } catch (err) {
    console.error('[discussioncode regenerate]', err);
    return errorResponse('Internal server error', 500);
  }
}
