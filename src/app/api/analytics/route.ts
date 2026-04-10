import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { getSocialAnalytics, getConnectedPlatforms } from '@/lib/ayrshare';

// Days covered by each period
const PERIOD_DAYS: Record<string, number> = {
  '7d': 7, '30d': 30, '90d': 90, '1y': 365,
};

const ALLOWED_PLATFORMS = ['instagram', 'twitter', 'facebook', 'tiktok', 'linkedin', 'youtube', 'snapchat', 'gmb'] as const;

const querySchema = z.object({
  period:   z.enum(['7d', '30d', '90d', '1y']).default('7d'),
  platform: z.enum(ALLOWED_PLATFORMS).optional(),
});

// ─── GET /api/analytics?period=7d&platform=instagram ─────────────────────────

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    period:   searchParams.get('period')   ?? undefined,
    platform: searchParams.get('platform') ?? undefined,
  });
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { period, platform } = parsed.data;
  const days  = PERIOD_DAYS[period];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // ── 1. Campaign aggregates from DB ─────────────────────────────────────────
  const campaigns = await prisma.campaign.findMany({
    where: {
      userId: user.sub,
      startDate: { gte: since },
      ...(platform ? { platforms: { contains: platform } } : {}),
    },
    select: { reach: true, impressions: true, clicks: true, spent: true },
  });

  const totalReach       = campaigns.reduce((s, c) => s + c.reach,       0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions,  0);
  const totalClicks      = campaigns.reduce((s, c) => s + c.clicks,       0);
  const totalSpent       = campaigns.reduce((s, c) => s + c.spent,        0);
  const engagement       = totalImpressions > 0
    ? Number(((totalClicks / totalImpressions) * 100).toFixed(2))
    : 0;

  // ── 2. Post counts from DB ─────────────────────────────────────────────────
  const postsCount = await prisma.post.count({
    where: {
      userId:    user.sub,
      createdAt: { gte: since },
      ...(platform ? { platform: { contains: platform } } : {}),
    },
  });

  // ── 3. Social followers from Ayrshare (best-effort) ───────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { profileKey: true },
  });

  let followersByPlatform: Record<string, number> = {};
  let totalFollowers = 0;

  if (dbUser?.profileKey) {
    const live = await getConnectedPlatforms(dbUser.profileKey);
    if (live) {
      followersByPlatform = Object.fromEntries(
        Object.entries(live).map(([k, v]) => [k, v.followers ?? 0])
      );
      totalFollowers = Object.values(followersByPlatform).reduce((s, n) => s + n, 0);
    }
  }

  // Fall back to SocialAccount DB data
  if (totalFollowers === 0) {
    const socials = await prisma.socialAccount.findMany({
      where: { userId: user.sub, connected: true },
      select: { platform: true, followers: true },
    });
    followersByPlatform = Object.fromEntries(socials.map(s => [s.platform, s.followers]));
    totalFollowers = socials.reduce((s, a) => s + a.followers, 0);
  }

  // ── 4. MOS score — dynamic composite (0-100) ─────────────────────────────
  //   Posts published (40%) + social accounts connected (30%) + profile completed (30%)
  const [totalPublishedPosts, totalConnectedAccounts, userActivity] = await Promise.all([
    prisma.post.count({ where: { userId: user.sub, status: 'published' } }),
    prisma.socialAccount.count({ where: { userId: user.sub, connected: true } }),
    prisma.activity.findUnique({ where: { userId: user.sub } }),
  ]);

  const postScore    = Math.min(40, totalPublishedPosts * 4);
  const socialScore  = Math.min(30, totalConnectedAccounts * 10);
  const profileScore = userActivity ? 30 : 0;
  const mosScore     = postScore + socialScore + profileScore;

  // ── 5. Ayrshare platform-level analytics (best-effort) ────────────────────
  const platforms = platform ? [platform] : Object.keys(followersByPlatform);
  let socialAnalytics: Record<string, unknown> | null = null;
  if (dbUser?.profileKey && platforms.length > 0) {
    socialAnalytics = await getSocialAnalytics(platforms, dbUser.profileKey);
  }

  return Response.json({
    period,
    platform: platform ?? null,
    mosScore,
    reach:       totalReach,
    impressions: totalImpressions,
    clicks:      totalClicks,
    spent:       totalSpent,
    engagement,
    posts:       postsCount,
    followers: {
      total:    totalFollowers,
      byPlatform: followersByPlatform,
    },
    social:    socialAnalytics,
  });
}
