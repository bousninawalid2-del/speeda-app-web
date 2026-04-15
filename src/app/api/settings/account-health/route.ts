import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { getConnectedPlatforms } from '@/lib/ayrshare';
import { toUserIdBigInt } from '@/lib/user-id';

type HealthStatus = 'healthy' | 'warning' | 'error';
type DbSocialAccount = {
  platform: string;
  username: string | null;
  followers: number;
  connected: boolean;
  updatedAt: Date;
};
type DbPost = {
  platform: string;
  status: string;
};

function toStatus(connected: boolean, errors: number): HealthStatus {
  if (!connected) return 'error';
  if (errors > 0) return 'warning';
  return 'healthy';
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const userId = toUserIdBigInt(auth.user.sub);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileKey: true },
  });

  if (!user?.profileKey) {
    return NextResponse.json({ error: 'Account health provider unavailable' }, { status: 503 });
  }

  const livePlatforms = await getConnectedPlatforms(user.profileKey);
  if (!livePlatforms) {
    return NextResponse.json({ error: 'Account health provider unavailable' }, { status: 503 });
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [dbAccounts, monthPosts]: [DbSocialAccount[], DbPost[]] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { userId },
      select: {
        platform: true,
        username: true,
        followers: true,
        connected: true,
        updatedAt: true,
      },
      orderBy: { connectedAt: 'desc' },
    }),
    prisma.post.findMany({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
      select: {
        platform: true,
        status: true,
      },
    }),
  ]);

  const postsByPlatform = new Map<string, { total: number; failed: number }>();
  for (const post of monthPosts) {
    const platform = post.platform.toLowerCase();
    const current = postsByPlatform.get(platform) ?? { total: 0, failed: 0 };
    current.total += 1;
    if (post.status.toLowerCase() === 'failed') current.failed += 1;
    postsByPlatform.set(platform, current);
  }

  const allPlatforms = new Set<string>([
    ...dbAccounts.map((account) => account.platform.toLowerCase()),
    ...Object.keys(livePlatforms).map((platform) => platform.toLowerCase()),
  ]);

  const accounts = Array.from(allPlatforms).map((platform) => {
    const dbAccount = dbAccounts.find((account: DbSocialAccount) => account.platform.toLowerCase() === platform);
    const live = livePlatforms[platform];
    const connected = Boolean(live || dbAccount?.connected);
    const monthStats = postsByPlatform.get(platform) ?? { total: 0, failed: 0 };

    return {
      platform,
      username: live?.username ?? dbAccount?.username ?? null,
      followers: live?.followers ?? dbAccount?.followers ?? 0,
      connected,
      status: toStatus(connected, monthStats.failed),
      errors: monthStats.failed,
      postsThisMonth: monthStats.total,
      lastSync: dbAccount?.updatedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ accounts });
}
