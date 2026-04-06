import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';

const updateSchema = z.object({
  caption:     z.string().min(1).max(4000).optional(),
  hashtags:    z.string().optional(),
  mediaUrls:   z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  status:      z.enum(['Draft', 'Scheduled', 'Published', 'Failed']).optional(),
  ayrshareId:  z.string().optional(),
});

// ─── PATCH /api/posts/:id ─────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post)               return errorResponse('Post not found', 404);
  if (post.userId !== user.sub) return errorResponse('Forbidden', 403);

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { caption, hashtags, mediaUrls, scheduledAt, status, ayrshareId } = parsed.data;

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(caption     !== undefined ? { caption }     : {}),
      ...(hashtags    !== undefined ? { hashtags }    : {}),
      ...(mediaUrls   !== undefined ? { mediaUrls: JSON.stringify(mediaUrls) } : {}),
      ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
      ...(status      !== undefined ? { status }      : {}),
      ...(ayrshareId  !== undefined ? { ayrshareId }  : {}),
    },
  });

  return Response.json({ post: updated });
}

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post)                   return errorResponse('Post not found', 404);
  if (post.userId !== user.sub) return errorResponse('Forbidden', 403);

  await prisma.post.delete({ where: { id } });

  return Response.json({ message: 'Post deleted' });
}
