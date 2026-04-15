import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-guard';
import { makeDiscussionCode } from '@/lib/discussion-code';
import { ENGAGEMENT_FILTERS, fetchEngagementFromProvider } from '@/lib/engagement-feed';

const querySchema = z.object({
  filter: z.enum(ENGAGEMENT_FILTERS).default('All'),
});

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const parsed = querySchema.safeParse({
    filter: request.nextUrl.searchParams.get('filter') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const discuCode = makeDiscussionCode(auth.user.sub);

  try {
    const data = await fetchEngagementFromProvider(parsed.data.filter, discuCode);
    return NextResponse.json({ engagementMessages: data.engagementMessages });
  } catch {
    return NextResponse.json({ error: 'Engagement provider unavailable' }, { status: 503 });
  }
}
