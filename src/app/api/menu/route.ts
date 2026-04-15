import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, requireAuth } from '@/lib/auth-guard';
import { toJsonSafe, toUserIdBigInt } from '@/lib/user-id';

const payloadSchema = z.object({
  description: z.string().optional().nullable(),
  name: z.string().max(255).optional().nullable(),
  url: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const userId = toUserIdBigInt(auth.user.sub);
  const menu = await prisma.menu.findUnique({ where: { userId } });
  return NextResponse.json({ menu: toJsonSafe(menu) });
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = toUserIdBigInt(auth.user.sub);

    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const menu = await prisma.menu.upsert({
      where: { userId },
      create: {
        userId,
        description: parsed.data.description ?? null,
        name: parsed.data.name ?? null,
        url: parsed.data.url ?? null,
      },
      update: {
        description: parsed.data.description ?? null,
        name: parsed.data.name ?? null,
        url: parsed.data.url ?? null,
      },
    });

    return NextResponse.json({ menu: toJsonSafe(menu) });
  } catch (err) {
    console.error('[menu]', err);
    return errorResponse('Internal server error', 500);
  }
}
