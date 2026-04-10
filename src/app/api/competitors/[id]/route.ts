import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';

/**
 * PATCH /api/competitors/[id]
 * Updates a Competitor's data.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const { id } = await params;

  const existing = await prisma.competitor.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return errorResponse('Competitor not found', 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const { name, platform, handle, followers, postsPerWeek, avgEngagement, lastSynced } = body as Record<string, unknown>;

  const competitor = await prisma.competitor.update({
    where: { id },
    data: {
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof platform === 'string' ? { platform } : {}),
      ...(typeof handle === 'string' ? { handle } : {}),
      ...(typeof followers === 'number' ? { followers } : {}),
      ...(typeof postsPerWeek === 'number' ? { postsPerWeek } : {}),
      ...(typeof avgEngagement === 'number' ? { avgEngagement } : {}),
      ...(typeof lastSynced === 'string' ? { lastSynced: new Date(lastSynced) } : {}),
    },
  });

  return NextResponse.json({ competitor });
}

/**
 * DELETE /api/competitors/[id]
 * Deletes a Competitor (verifies ownership).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const { id } = await params;

  const existing = await prisma.competitor.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return errorResponse('Competitor not found', 404);
  }

  await prisma.competitor.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
