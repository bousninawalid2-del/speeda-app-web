import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { errorResponse } from '@/lib/auth-guard';

/**
 * GET /api/n8n/draft-posts?weeklyPlanningId=xxx
 * or  /api/n8n/draft-posts?strategyId=xxx
 *
 * List draft posts for a given weekly planning or strategy.
 */
export async function GET(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  const weeklyPlanningId = req.nextUrl.searchParams.get('weeklyPlanningId');
  const strategyId       = req.nextUrl.searchParams.get('strategyId');

  if (!weeklyPlanningId && !strategyId) {
    return errorResponse('weeklyPlanningId or strategyId is required', 400);
  }

  if (weeklyPlanningId) {
    const posts = await prisma.draftPost.findMany({
      where: { weeklyPlanningId },
      orderBy: { postDate: 'asc' },
    });
    return Response.json({ posts });
  }

  // Get all draft posts for a strategy (across all weeks)
  const posts = await prisma.draftPost.findMany({
    where: { weeklyPlanning: { strategyId: strategyId! } },
    orderBy: { postDate: 'asc' },
    include: { weeklyPlanning: { select: { weekNumber: true } } },
  });
  return Response.json({ posts });
}

/**
 * POST /api/n8n/draft-posts
 *
 * Create a draft post within a weekly planning.
 */
const createSchema = z.object({
  weeklyPlanningId: z.string().min(1),
  platform:         z.string().optional(),
  caption:          z.string().optional(),
  hashtags:         z.string().optional(),
  mediaUrl:         z.string().optional(),
  mediaType:        z.string().optional(),
  postDate:         z.string().optional(),
  postTime:         z.string().optional(),
  postDetails:      z.string().optional(),
  postReminder:     z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { postDate, ...data } = parsed.data;

  const post = await prisma.draftPost.create({
    data: {
      ...data,
      postDate: postDate ? new Date(postDate) : null,
    },
  });

  return Response.json({ post }, { status: 201 });
}

/**
 * PATCH /api/n8n/draft-posts
 *
 * Update a draft post (caption, image, status, etc.)
 * Body must include { id: "draftPostId", ...fieldsToUpdate }
 */
const updateSchema = z.object({
  id:           z.string().min(1),
  caption:      z.string().optional(),
  hashtags:     z.string().optional(),
  mediaUrl:     z.string().optional(),
  mediaType:    z.string().optional(),
  postDate:     z.string().optional(),
  postTime:     z.string().optional(),
  postDetails:  z.string().optional(),
  postReminder: z.string().optional(),
  status:       z.enum(['draft', 'approved', 'published', 'rejected']).optional(),
  publishedPostId: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { id, postDate, ...data } = parsed.data;

  const post = await prisma.draftPost.update({
    where: { id },
    data: {
      ...data,
      ...(postDate !== undefined ? { postDate: postDate ? new Date(postDate) : null } : {}),
    },
  });

  return Response.json({ post });
}
