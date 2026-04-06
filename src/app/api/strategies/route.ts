import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';

/**
 * GET /api/strategies
 *
 * List the current user's strategies with weekly plannings and draft posts.
 * Optional: ?status=active to filter by status.
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const status = req.nextUrl.searchParams.get('status') ?? undefined;

  const strategies = await prisma.strategy.findMany({
    where: {
      userId: user.sub,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      weeklyPlannings: {
        orderBy: { weekNumber: 'asc' },
        include: {
          draftPosts: { orderBy: { postDate: 'asc' } },
        },
      },
    },
  });

  return Response.json({ strategies });
}
