import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { AyrshareError } from '@/lib/ayrshare';
import { fetchAllReceivedMessages, messageToCard, resolveProfileKey } from '@/lib/ayrshare-engagement';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  try {
    const profileKey = await resolveProfileKey(userId);
    const { messages, messagingDisabled } = await fetchAllReceivedMessages(userId, profileKey);
    return NextResponse.json({
      items: messages.map(messageToCard),
      messagingDisabled,
    });
  } catch (err) {
    if (err instanceof AyrshareError) {
      const messagingDisabled = err.status === 400;
      return NextResponse.json(
        { error: err.message, code: err.code, messagingDisabled, items: [] },
        { status: messagingDisabled ? 200 : err.status },
      );
    }
    return NextResponse.json({ error: 'Engagement provider unavailable', code: 'provider_error' }, { status: 503 });
  }
}
