import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, requireAuth } from '@/lib/auth-guard';
import { toJsonSafe, toUserIdBigInt } from '@/lib/user-id';

const createSchema = z.object({
  platforme: z.string().max(255).optional().nullable(),
  post: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const userId = toUserIdBigInt(auth.user.sub);
  const rows = await prisma.postrapide.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
  });
  return NextResponse.json({ postrapide: toJsonSafe(rows) });
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = toUserIdBigInt(auth.user.sub);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const row = await prisma.postrapide.create({
      data: {
        userId,
        platforme: parsed.data.platforme ?? null,
        post: parsed.data.post ?? null,
        url: parsed.data.url ?? null,
      },
    });
    return NextResponse.json({ postrapide: toJsonSafe(row) }, { status: 201 });
  } catch (err) {
    console.error('[postrapide]', err);
    return errorResponse('Internal server error', 500);
  }
}
