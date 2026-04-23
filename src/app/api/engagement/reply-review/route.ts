import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-guard';
import { AyrshareError, replyToReview } from '@/lib/ayrshare';
import { invalidateEngagementCache, resolveProfileKey } from '@/lib/ayrshare-engagement';

const bodySchema = z.object({
  reviewId: z.string().min(1),
  reply: z.string().min(1).max(4000),
  platform: z.enum(['gmb', 'facebook']),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
  }

  try {
    const profileKey = await resolveProfileKey(userId);
    const result = await replyToReview({ ...parsed.data, profileKey });
    invalidateEngagementCache(userId);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof AyrshareError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: 'Reply failed', code: 'provider_error' }, { status: 503 });
  }
}
