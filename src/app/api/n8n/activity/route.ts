import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { errorResponse } from '@/lib/auth-guard';

/**
 * POST /api/n8n/activity
 *
 * Upsert business activity profile — called by n8n social_media_activity workflow
 * when the user finishes the data collection conversation.
 */

const schema = z.object({
  userId:              z.string().min(1),
  business_name:       z.string().optional(),
  industry:            z.string().optional(),
  country:             z.string().optional(),
  location:            z.string().optional(),
  opening_hours:       z.string().optional(),
  business_size:       z.string().optional(),
  year_founded:        z.string().optional(),
  audience_target:     z.string().optional(),
  unique_selling_point: z.string().optional(),
  certifications:      z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { userId, ...data } = parsed.data;

  const activity = await prisma.activity.upsert({
    where:  { userId },
    create: { userId, ...data },
    update: data,
  });

  return Response.json({ activity });
}

/**
 * GET /api/n8n/activity?userId=xxx
 */
export async function GET(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return errorResponse('userId is required', 400);

  const activity = await prisma.activity.findUnique({ where: { userId } });
  return Response.json({ activity });
}
