import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { AyrshareError } from '@/lib/ayrshare';
import { commentToCard, fetchAllComments, resolveProfileKey } from '@/lib/ayrshare-engagement';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  try {
    const profileKey = await resolveProfileKey(userId);
    const comments = await fetchAllComments(userId, profileKey);
    return NextResponse.json({ items: comments.map(commentToCard) });
  } catch (err) {
    if (err instanceof AyrshareError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: 'Engagement provider unavailable', code: 'provider_error' }, { status: 503 });
  }
}
