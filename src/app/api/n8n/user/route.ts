import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { errorResponse } from '@/lib/auth-guard';
import { toJsonSafe, toUserIdString } from '@/lib/user-id';
import { parseUserId } from '@/lib/n8n-validate';
import { computeUserFlags } from '@/lib/n8n-payload';

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
  const normalizedUserId = parseUserId(userId);
  if (typeof normalizedUserId !== 'bigint') return normalizedUserId;

  const [user, activity, preference, strategy, images] = await Promise.all([
    prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: {
        id: true, name: true, email: true, phone: true,
        isVerified: true, tokenBalance: true, profileKey: true, password: true,
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

  const { password, ...publicUser } = user;
  const flags = await computeUserFlags({ id: user.id, password, isVerified: user.isVerified }, 'whatsapp');

  return Response.json({
    user: { ...publicUser, id: toUserIdString(user.id) },
    activity: toJsonSafe(activity),
    preference: toJsonSafe(preference),
    strategy: toJsonSafe(strategy),
    images: toJsonSafe(images),
    flags,
  });
}
