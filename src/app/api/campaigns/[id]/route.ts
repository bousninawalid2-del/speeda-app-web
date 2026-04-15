import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { toUserIdBigInt } from '@/lib/user-id';

const patchSchema = z.object({
  status:  z.enum(['Active', 'Scheduled', 'Completed', 'Paused', 'Draft']).optional(),
  spent:   z.number().int().min(0).optional(),
  reach:   z.number().int().min(0).optional(),
  impressions: z.number().int().min(0).optional(),
  clicks:  z.number().int().min(0).optional(),
  roi:     z.number().positive().optional(),
  budget:  z.number().int().positive().optional(),
  ayrsharePostIds: z.string().optional(),
}).strict();

async function getOwned(id: string, userId: bigint) {
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c || c.userId !== userId) return null;
  return c;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const userId = toUserIdBigInt(auth.user.sub);
  const { id } = await params;

  const campaign = await getOwned(id, userId);
  if (!campaign) return errorResponse('Not found', 404);

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const updated = await prisma.campaign.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json({ campaign: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const userId = toUserIdBigInt(auth.user.sub);
  const { id } = await params;

  const campaign = await getOwned(id, userId);
  if (!campaign) return errorResponse('Not found', 404);

  await prisma.campaign.delete({ where: { id } });
  return Response.json({ message: 'Campaign deleted' });
}
