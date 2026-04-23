import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { AyrshareError } from '@/lib/ayrshare';
import {
  commentToCard,
  fetchAllComments,
  fetchAllReceivedMessages,
  fetchAllReviews,
  messageToCard,
  resolveProfileKey,
  reviewToCard,
  type EngagementCard,
} from '@/lib/ayrshare-engagement';

type Filter = 'All' | 'Comments' | 'Reviews' | 'DMs';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;
  const filter = (req.nextUrl.searchParams.get('filter') ?? 'All') as Filter;

  try {
    const profileKey = await resolveProfileKey(userId);

    const wantComments = filter === 'All' || filter === 'Comments';
    const wantReviews = filter === 'All' || filter === 'Reviews';
    const wantDMs = filter === 'All' || filter === 'DMs';

    const [commentsR, reviewsR, messagesR] = await Promise.allSettled([
      wantComments ? fetchAllComments(userId, profileKey) : Promise.resolve([]),
      wantReviews ? fetchAllReviews(userId, profileKey) : Promise.resolve([]),
      wantDMs ? fetchAllReceivedMessages(userId, profileKey) : Promise.resolve({ messages: [], messagingDisabled: false }),
    ]);

    const items: EngagementCard[] = [];
    let messagingDisabled = false;
    const warnings: Array<{ source: string; code: string; message: string }> = [];

    if (commentsR.status === 'fulfilled') {
      for (const c of commentsR.value) items.push(commentToCard(c));
    } else if (commentsR.reason instanceof AyrshareError) {
      warnings.push({ source: 'comments', code: commentsR.reason.code, message: commentsR.reason.message });
    }

    if (reviewsR.status === 'fulfilled') {
      for (const r of reviewsR.value) items.push(reviewToCard(r));
    } else if (reviewsR.reason instanceof AyrshareError) {
      warnings.push({ source: 'reviews', code: reviewsR.reason.code, message: reviewsR.reason.message });
    }

    if (messagesR.status === 'fulfilled') {
      const value = messagesR.value as { messages: Parameters<typeof messageToCard>[0][]; messagingDisabled: boolean };
      for (const m of value.messages) items.push(messageToCard(m));
      messagingDisabled = value.messagingDisabled;
    } else if (messagesR.reason instanceof AyrshareError) {
      if (messagesR.reason.status === 400) messagingDisabled = true;
      else warnings.push({ source: 'messages', code: messagesR.reason.code, message: messagesR.reason.message });
    }

    items.sort((a, b) => Date.parse(b.created) - Date.parse(a.created));

    return NextResponse.json({
      items,
      messagingDisabled,
      warnings,
      counts: {
        total: items.length,
        comments: items.filter(i => i.type === 'Comment').length,
        reviews: items.filter(i => i.type === 'Review').length,
        dms: items.filter(i => i.type === 'DM').length,
      },
    });
  } catch (err) {
    if (err instanceof AyrshareError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: 'Engagement provider unavailable', code: 'provider_error' }, { status: 503 });
  }
}
