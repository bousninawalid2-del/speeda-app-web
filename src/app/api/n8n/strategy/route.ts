import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { errorResponse } from '@/lib/auth-guard';
import { toJsonSafe, toUserIdBigInt } from '@/lib/user-id';

/**
 * POST /api/n8n/strategy
 *
 * Create a full strategy with weekly plannings and draft posts.
 * Called by n8n strategie_social_media workflow when the user confirms the strategy.
 */

const draftPostSchema = z.object({
  platform:    z.string().optional(),
  caption:     z.string().optional(),
  hashtags:    z.string().optional(),
  mediaUrl:    z.string().optional(),
  mediaType:   z.string().optional(),
  postDate:    z.string().optional(),
  postTime:    z.string().optional(),
  postDetails: z.string().optional(),
  postReminder: z.string().optional(),
});

const weekSchema = z.object({
  weekNumber:    z.number(),
  weekStartDate: z.string().optional(),
  weekEndDate:   z.string().optional(),
  postsCount:    z.number().optional(),
  weeklyGoal:    z.string().optional(),
  posts:         z.array(draftPostSchema).optional(),
});

const schema = z.object({
  userId:          z.string().min(1),
  name:            z.string().optional(),
  periodStartDate: z.string().optional(),
  periodEndDate:   z.string().optional(),
  weekCount:       z.number().optional(),
  goal:            z.string().optional(),
  platforms:       z.string().optional(),
  n8nSessionId:    z.string().optional(),
  weeks:           z.array(weekSchema).optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { userId, weeks, periodStartDate, periodEndDate, ...strategyData } = parsed.data;
  const normalizedUserId = toUserIdBigInt(userId);

  // Deactivate any existing active strategy for this user
  await prisma.strategy.updateMany({
    where: { userId: normalizedUserId, status: 'active' },
    data:  { status: 'completed' },
  });

  // Create the strategy with nested weekly plannings and draft posts
  const strategy = await prisma.strategy.create({
    data: {
      userId: normalizedUserId,
      ...strategyData,
      periodStartDate: periodStartDate ? new Date(periodStartDate) : null,
      periodEndDate:   periodEndDate   ? new Date(periodEndDate)   : null,
      weeklyPlannings: weeks ? {
        create: weeks.map(w => ({
          weekNumber:    w.weekNumber,
          weekStartDate: w.weekStartDate ? new Date(w.weekStartDate) : null,
          weekEndDate:   w.weekEndDate   ? new Date(w.weekEndDate)   : null,
          postsCount:    w.postsCount ?? 0,
          weeklyGoal:    w.weeklyGoal,
          draftPosts: w.posts ? {
            create: w.posts.map(p => ({
              platform:     p.platform,
              caption:      p.caption,
              hashtags:     p.hashtags,
              mediaUrl:     p.mediaUrl,
              mediaType:    p.mediaType,
              postDate:     p.postDate ? new Date(p.postDate) : null,
              postTime:     p.postTime,
              postDetails:  p.postDetails,
              postReminder: p.postReminder,
            })),
          } : undefined,
        })),
      } : undefined,
    },
    include: {
      weeklyPlannings: {
        include: { draftPosts: true },
        orderBy: { weekNumber: 'asc' },
      },
    },
  });

  return Response.json({ strategy: toJsonSafe(strategy) }, { status: 201 });
}

/**
 * GET /api/n8n/strategy?userId=xxx
 *
 * Returns the active strategy with all weekly plans and draft posts.
 */
export async function GET(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return errorResponse('userId is required', 400);

  const strategy = await prisma.strategy.findFirst({
    where: { userId: toUserIdBigInt(userId), status: 'active' },
    orderBy: { createdAt: 'desc' },
    include: {
      weeklyPlannings: {
        orderBy: { weekNumber: 'asc' },
        include: { draftPosts: { orderBy: { postDate: 'asc' } } },
      },
    },
  });

  return Response.json({ strategy: toJsonSafe(strategy) });
}
