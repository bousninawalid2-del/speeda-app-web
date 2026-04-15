import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { errorResponse } from '@/lib/auth-guard';
import { syncPreferenceToN8n } from '@/lib/sync-n8n';
import { toJsonSafe, toUserIdBigInt } from '@/lib/user-id';

/**
 * POST /api/n8n/preference
 *
 * Upsert brand preferences — called by n8n social_media_preference workflow.
 */

const schema = z.object({
  userId:               z.string().min(1),
  tone_of_voice:        z.string().optional(),
  language_preference:  z.string().optional(),
  business_description: z.string().optional(),
  social_media_goals:   z.string().optional(),
  color_primary:        z.string().optional(),
  color_secondary:      z.string().optional(),
  preferred_platforms:  z.string().optional(),
  hashtags:             z.string().optional(),
  emojis:               z.string().optional(),
  other:                z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { userId, ...data } = parsed.data;
  const normalizedUserId = toUserIdBigInt(userId);

  const preference = await prisma.preference.upsert({
    where:  { userId: normalizedUserId },
    create: { userId: normalizedUserId, ...data },
    update: data,
  });

  // Fire-and-forget sync to n8n datatest — must not block the response
  syncPreferenceToN8n(normalizedUserId).catch(() => {});

  return Response.json({ preference: toJsonSafe(preference) });
}

/**
 * GET /api/n8n/preference?userId=xxx
 */
export async function GET(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return errorResponse('userId is required', 400);

  const preference = await prisma.preference.findUnique({ where: { userId: toUserIdBigInt(userId) } });
  return Response.json({ preference: toJsonSafe(preference) });
}
