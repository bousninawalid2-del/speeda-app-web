import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';

/**
 * GET /api/competitors
 * Returns all Competitors for the current user.
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const competitors = await prisma.competitor.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ competitors });
}

/**
 * POST /api/competitors
 * Creates a new Competitor for the current user.
 * Body: { name, platform, handle, followers?, postsPerWeek?, avgEngagement? }
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const { name, platform, handle, followers, postsPerWeek, avgEngagement } = body as Record<string, unknown>;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return errorResponse('name is required', 400);
  }
  if (!platform || typeof platform !== 'string' || platform.trim() === '') {
    return errorResponse('platform is required', 400);
  }
  if (!handle || typeof handle !== 'string' || handle.trim() === '') {
    return errorResponse('handle is required', 400);
  }

  const competitor = await prisma.competitor.create({
    data: {
      userId,
      name: (name as string).trim(),
      platform: (platform as string).trim(),
      handle: (handle as string).trim(),
      followers: typeof followers === 'number' ? followers : 0,
      postsPerWeek: typeof postsPerWeek === 'number' ? postsPerWeek : 0,
      avgEngagement: typeof avgEngagement === 'number' ? avgEngagement : 0,
    },
  });

  return NextResponse.json({ competitor }, { status: 201 });
}
