import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';

const bodySchema = z.object({
  platform: z.string().min(1),
});

/**
 * POST /api/social/disconnect
 *
 * Marks the given platform as disconnected in the DB.
 * Body: { platform: string }
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { platform } = parsed.data;

  const account = await prisma.socialAccount.findUnique({
    where: { userId_platform: { userId: user.sub, platform } },
  });

  if (!account) return errorResponse('Account not found', 404);

  await prisma.socialAccount.update({
    where: { userId_platform: { userId: user.sub, platform } },
    data: { connected: false },
  });

  return Response.json({ message: 'Disconnected' });
}
