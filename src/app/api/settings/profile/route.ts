import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { toUserIdBigInt, toUserIdString } from '@/lib/user-id';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(5).max(30).optional(),
  businessName: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  industry: z.string().max(120).optional(),
});

function normalizeNullable(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = toUserIdBigInt(auth.user.sub);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        tokenBalance: true,
        tokenUsed: true,
        activity: {
          select: {
            business_name: true,
            industry: true,
            location: true,
            business_size: true,
          },
        },
      },
    });

    if (!user) return errorResponse('User not found', 404);

    return NextResponse.json({
      profile: {
        ...user,
        id: toUserIdString(user.id),
        activity: user.activity
          ? {
              ...user.activity,
              // Activity currently has no dedicated country field in this schema/version.
              country: null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[settings/profile][GET]', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const userId = toUserIdBigInt(auth.user.sub);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON', 400);
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const userData = {
      name: normalizeNullable(parsed.data.name),
      phone: normalizeNullable(parsed.data.phone),
    };

    const activityData = {
      business_name: normalizeNullable(parsed.data.businessName),
      location: normalizeNullable(parsed.data.city),
      industry: normalizeNullable(parsed.data.industry),
    };

    const operations = [];
    if (userData.name !== undefined || userData.phone !== undefined) {
      operations.push(
        prisma.user.update({
          where: { id: userId },
          data: userData,
        })
      );
    }
    if (activityData.business_name !== undefined || activityData.location !== undefined || activityData.industry !== undefined) {
      operations.push(
        prisma.activity.upsert({
          where: { userId },
          create: { userId, ...activityData },
          update: activityData,
        })
      );
    }
    if (operations.length === 0) {
      return errorResponse('Nothing to update', 400);
    }

    await prisma.$transaction(operations);

    const refreshed = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        tokenBalance: true,
        tokenUsed: true,
        activity: {
          select: {
            business_name: true,
            industry: true,
            location: true,
            business_size: true,
          },
        },
      },
    });

    if (!refreshed) return errorResponse('User not found', 404);

    return NextResponse.json({
      profile: {
        ...refreshed,
        id: toUserIdString(refreshed.id),
        activity: refreshed.activity
          ? {
              ...refreshed.activity,
              // Activity currently has no dedicated country field in this schema/version.
              country: null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[settings/profile][PATCH]', error);
    return errorResponse('Internal server error', 500);
  }
}
