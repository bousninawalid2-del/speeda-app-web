import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { syncPreferenceToN8n, syncActivityToN8n } from '@/lib/sync-n8n';

const setupSchema = z.object({
  // Activity
  business_name:        z.string().min(1, 'Business name is required'),
  industry:             z.string().optional(),
  country:              z.string().optional(),
  location:             z.string().optional(),
  opening_hours:        z.string().optional(),
  business_size:        z.string().optional(),
  year_founded:         z.string().optional(),
  audience_target:      z.string().optional(),
  unique_selling_point: z.string().optional(),
  certifications:       z.string().optional(),
  // Preference
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
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const {
    business_name, industry, country, location, opening_hours,
    business_size, year_founded, audience_target, unique_selling_point, certifications,
    tone_of_voice, language_preference, business_description,
    social_media_goals, color_primary, color_secondary,
    preferred_platforms, hashtags, emojis, other,
  } = parsed.data;
  const finalLocation = location ?? country;

  const [activity, preference] = await prisma.$transaction([
    prisma.activity.upsert({
      where:  { userId: user.sub },
      create: { userId: user.sub, business_name, industry, location: finalLocation, opening_hours, business_size, year_founded, audience_target, unique_selling_point, certifications },
      update: { business_name, industry, location: finalLocation, opening_hours, business_size, year_founded, audience_target, unique_selling_point, certifications },
    }),
    prisma.preference.upsert({
      where:  { userId: user.sub },
      create: { userId: user.sub, tone_of_voice, language_preference, business_description, social_media_goals, color_primary, color_secondary, preferred_platforms, hashtags, emojis, other },
      update: { tone_of_voice, language_preference, business_description, social_media_goals, color_primary, color_secondary, preferred_platforms, hashtags, emojis, other },
    }),
  ]);

  // Fire-and-forget sync to n8n datatest — must not block the response
  syncPreferenceToN8n(user.sub).catch(() => {});
  syncActivityToN8n(user.sub).catch(() => {});

  return Response.json({ activity, preference });
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const [activity, preference, images] = await Promise.all([
    prisma.activity.findUnique({ where: { userId: user.sub } }),
    prisma.preference.findUnique({ where: { userId: user.sub } }),
    prisma.dataImage.findMany({
      where: { userId: user.sub },
      select: { id: true, filename: true, mimetype: true, size: true, createdAt: true },
    }),
  ]);

  return Response.json({ activity, preference, images });
}
