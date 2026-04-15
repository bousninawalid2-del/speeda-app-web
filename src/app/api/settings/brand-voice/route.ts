import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { toUserIdBigInt } from '@/lib/user-id';

const payloadSchema = z.object({
  tones: z.array(z.string().min(1)).default([]),
  langs: z.array(z.string().min(1)).default([]),
  keywords: z.array(z.string().min(1)).default([]),
  businessDescription: z.string().optional().default(''),
  sampleContent: z.string().optional().default(''),
  otherLang: z.string().optional().default(''),
});

function splitCsv(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const userId = toUserIdBigInt(auth.user.sub);
  const preference = await prisma.preference.findUnique({ where: { userId } });

  return NextResponse.json({
    tones: splitCsv(preference?.tone_of_voice),
    langs: splitCsv(preference?.language_preference),
    keywords: splitCsv(preference?.hashtags).map((entry) => entry.replace(/^#/, '')),
    businessDescription: preference?.resumer ?? '',
    sampleContent: preference?.text ?? '',
    otherLang: preference?.other ?? '',
  });
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

    const userId = toUserIdBigInt(auth.user.sub);
    const tone_of_voice = parsed.data.tones.join(',');
    const language_preference = parsed.data.langs.join(',');
    const hashtags = parsed.data.keywords.join(',');

    const preference = await prisma.preference.upsert({
      where: { userId },
      create: {
        userId,
        tone_of_voice: tone_of_voice || null,
        language_preference: language_preference || null,
        hashtags: hashtags || null,
        resumer: parsed.data.businessDescription || null,
        text: parsed.data.sampleContent || null,
        other: parsed.data.otherLang || null,
      },
      update: {
        tone_of_voice: tone_of_voice || null,
        language_preference: language_preference || null,
        hashtags: hashtags || null,
        resumer: parsed.data.businessDescription || null,
        text: parsed.data.sampleContent || null,
        other: parsed.data.otherLang || null,
      },
    });

    return NextResponse.json({
      tones: splitCsv(preference.tone_of_voice),
      langs: splitCsv(preference.language_preference),
      keywords: splitCsv(preference.hashtags).map((entry) => entry.replace(/^#/, '')),
      businessDescription: preference.resumer ?? '',
      sampleContent: preference.text ?? '',
      otherLang: preference.other ?? '',
    });
  } catch (err) {
    console.error('[settings/brand-voice]', err);
    return errorResponse('Internal server error', 500);
  }
}
