import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { toUserIdBigInt, toUserIdString } from '@/lib/user-id';

const patchSchema = z.object({
  name:  z.string().min(1).max(100).optional(),
  phone: z.string().min(5).max(30).optional(),
}).refine(d => d.name !== undefined || d.phone !== undefined, {
  message: 'Nothing to update',
});

/** GET /api/auth/me — get the current user profile */
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = toUserIdBigInt(auth.user.sub);

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, phone: true,
        isVerified: true, createdAt: true,
        tokenBalance: true, tokenUsed: true,
        activity: {
          select: {
            business_name: true, industry: true,
            location: true, business_size: true,
          },
        },
      },
    });

    if (!dbUser) return errorResponse('User not found', 404);
    return NextResponse.json({ user: { ...dbUser, id: toUserIdString(dbUser.id) } });
  } catch (err) {
    console.error('[me]', err);
    return errorResponse('Internal server error', 500);
  }
}

/** PATCH /api/auth/me — update name and phone */
export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = toUserIdBigInt(auth.user.sub);

    let body: unknown;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const data: { name?: string; phone?: string } = {};
    if (parsed.data.name  !== undefined) data.name  = parsed.data.name.trim();
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone.trim();

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, phone: true },
    });

    return NextResponse.json({ user: { ...updated, id: toUserIdString(updated.id) } });
  } catch (err) {
    console.error('[me PATCH]', err);
    return errorResponse('Internal server error', 500);
  }
}
