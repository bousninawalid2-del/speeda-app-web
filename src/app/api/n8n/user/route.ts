import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { errorResponse } from '@/lib/auth-guard';
import { toJsonSafe, toUserIdBigInt, toUserIdString } from '@/lib/user-id';

/**
 * GET /api/n8n/user?userId=xxx
 *
 * Returns full user state for n8n routing decisions:
 * user profile, activity, preference, active strategy, brand images.
 */
export async function GET(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return errorResponse('userId is required', 400);
  const normalizedUserId = toUserIdBigInt(userId);

  const [user, activity, preference, strategy, images] = await Promise.all([
    prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: {
        id: true, name: true, email: true, phone: true,
        isVerified: true, tokenBalance: true, profileKey: true,
      },
    }),
    prisma.activity.findUnique({ where: { userId: normalizedUserId } }),
    prisma.preference.findUnique({ where: { userId: normalizedUserId } }),
    prisma.strategy.findFirst({
      where: { userId: normalizedUserId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: {
        weeklyPlannings: {
          orderBy: { weekNumber: 'asc' },
          include: { draftPosts: { orderBy: { postDate: 'asc' } } },
        },
      },
    }),
    prisma.dataImage.findMany({
      where: { userId: normalizedUserId },
      select: { id: true, filename: true, mimetype: true, size: true, createdAt: true },
    }),
  ]);

  if (!user) return errorResponse('User not found', 404);

  return Response.json({
    user: { ...user, id: toUserIdString(user.id) },
    activity: toJsonSafe(activity),
    preference: toJsonSafe(preference),
    strategy: toJsonSafe(strategy),
    images: toJsonSafe(images),
    flags: {
      user_exist: true,
      token_valide: user.tokenBalance > 0,
      activity_exist: !!activity,
      preference_exist: !!preference,
      user_strategy: !!strategy,
    },
  });
}
