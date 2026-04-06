import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { getConnectedPlatforms } from '@/lib/ayrshare';

// ─── GET /api/social — list connected social accounts ─────────────────────────
//
// 1. Fetch live platforms from Ayrshare (source of truth for what's connected)
// 2. Sync them into the DB (upsert: create new rows, update existing, mark removed as disconnected)
// 3. Return the merged list

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // Get user's Ayrshare profile key
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { profileKey: true },
  });

  let liveData: Record<string, { username?: string; followers?: number }> = {};

  if (dbUser?.profileKey) {
    liveData = (await getConnectedPlatforms(dbUser.profileKey)) ?? {};
  }

  const livePlatforms = Object.keys(liveData);

  // Sync live platforms into DB
  if (livePlatforms.length > 0) {
    for (const platform of livePlatforms) {
      const live = liveData[platform];
      await prisma.socialAccount.upsert({
        where: { userId_platform: { userId: user.sub, platform } },
        create: {
          userId: user.sub,
          platform,
          username: live.username ?? null,
          followers: live.followers ?? 0,
          connected: true,
        },
        update: {
          username: live.username ?? undefined,
          followers: live.followers ?? 0,
          connected: true,
        },
      });
    }

    // Mark platforms that are no longer in Ayrshare as disconnected
    await prisma.socialAccount.updateMany({
      where: {
        userId: user.sub,
        connected: true,
        platform: { notIn: livePlatforms },
      },
      data: { connected: false },
    });
  }

  // Return all accounts (connected and disconnected) so UI can show both
  const accounts = await prisma.socialAccount.findMany({
    where: { userId: user.sub },
    orderBy: { connectedAt: 'desc' },
  });

  return Response.json({
    accounts: accounts.map(a => ({
      platform: a.platform,
      username: a.username,
      followers: a.followers,
      connected: a.connected,
      connectedAt: a.connectedAt,
    })),
  });
}
