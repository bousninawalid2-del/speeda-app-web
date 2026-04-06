import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/webhooks/ayrshare
 *
 * Handles real-time Ayrshare webhook events.
 * Supported events:
 *  - platform_connected    → upsert SocialAccount as connected
 *  - platform_disconnected → mark SocialAccount as disconnected
 *
 * Ayrshare sends a webhook secret in the Authorization header.
 * Set AYRSHARE_WEBHOOK_SECRET in your environment.
 */
export async function POST(req: NextRequest) {
  // Verify webhook secret — reject if env var not configured
  const secret = process.env.AYRSHARE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[ayrshare webhook] AYRSHARE_WEBHOOK_SECRET is not set');
    return Response.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization') ?? '';
  const incoming = authHeader.replace(/^Bearer\s+/i, '');
  if (incoming !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body as {
    event?: string;
    profileKey?: string;
    platform?: string;
    username?: string;
    followers?: number;
  };

  if (!event.profileKey || !event.platform || !event.event) {
    return Response.json({ ok: true }); // Ignore malformed payloads
  }

  // Find the user who owns this profileKey
  const dbUser = await prisma.user.findFirst({
    where: { profileKey: event.profileKey },
    select: { id: true },
  });

  if (!dbUser) {
    return Response.json({ ok: true }); // Unknown profile — no-op
  }

  const platform = event.platform.toLowerCase();

  if (event.event === 'platform_connected') {
    await prisma.socialAccount.upsert({
      where: { userId_platform: { userId: dbUser.id, platform } },
      create: {
        userId:    dbUser.id,
        platform,
        username:  event.username,
        followers: event.followers ?? 0,
        connected: true,
      },
      update: {
        username:  event.username,
        followers: event.followers ?? 0,
        connected: true,
      },
    });
  } else if (event.event === 'platform_disconnected') {
    await prisma.socialAccount.updateMany({
      where: { userId: dbUser.id, platform },
      data: { connected: false },
    });
  }

  return Response.json({ ok: true });
}
