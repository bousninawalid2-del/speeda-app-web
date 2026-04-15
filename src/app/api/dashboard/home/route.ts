import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { toUserIdBigInt } from '@/lib/user-id';

type ActionPriority = 'critical' | 'high' | 'recommended';

interface HomeAction {
  id: number;
  priority: ActionPriority;
  color: string;
  title: string;
  desc: string;
  impact: string;
  impactIcon: string;
  nav: string;
}

type DbSocialAccount = {
  platform: string;
  connected: boolean;
  followers: number;
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const userId = toUserIdBigInt(auth.user.sub);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [user, socialAccounts, scheduledPosts, failedPostsThisMonth, pendingTasks]: [
    { tokenBalance: number } | null,
    DbSocialAccount[],
    number,
    number,
    number
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    }),
    prisma.socialAccount.findMany({
      where: { userId },
      select: { platform: true, connected: true, followers: true },
    }),
    prisma.post.count({
      where: { userId, status: 'Scheduled' },
    }),
    prisma.post.count({
      where: { userId, status: 'Failed', createdAt: { gte: monthStart } },
    }),
    prisma.actionTask.count({
      where: { userId, status: { in: ['pending', 'in_progress'] } },
    }),
  ]);

  const tokenCount = user?.tokenBalance ?? 0;
  const connectedPlatforms = socialAccounts.filter((account: DbSocialAccount) => account.connected);
  const disconnectedPlatforms = socialAccounts.filter((account: DbSocialAccount) => !account.connected);

  const actions: HomeAction[] = [];
  let actionId = 1;

  if (disconnectedPlatforms.length > 0) {
    actions.push({
      id: actionId++,
      priority: 'critical',
      color: 'bg-red-accent',
      title: `Reconnect ${disconnectedPlatforms[0].platform}`,
      desc: `Your ${disconnectedPlatforms[0].platform} account is disconnected. Reconnect to keep publishing.`,
      impact: 'Restore publishing',
      impactIcon: '🔗',
      nav: 'social',
    });
  }

  if (scheduledPosts === 0) {
    actions.push({
      id: actionId++,
      priority: 'high',
      color: 'bg-orange-accent',
      title: 'Schedule your next post',
      desc: 'No scheduled posts found. Add one to keep your audience engaged.',
      impact: '+40% reach',
      impactIcon: '📈',
      nav: 'create',
    });
  }

  if (tokenCount < 50) {
    actions.push({
      id: actionId++,
      priority: 'high',
      color: 'bg-orange-accent',
      title: 'Top up your AI tokens',
      desc: `You have ${tokenCount} tokens left. Buy more to keep creating content.`,
      impact: 'Uninterrupted AI',
      impactIcon: '✦',
      nav: 'tokens-packs',
    });
  }

  if (connectedPlatforms.length === 0) {
    actions.push({
      id: actionId++,
      priority: 'critical',
      color: 'bg-red-accent',
      title: 'Connect your social media',
      desc: 'Connect at least one platform to start publishing content and tracking analytics.',
      impact: 'Enable publishing',
      impactIcon: '🔗',
      nav: 'social',
    });
  }

  actions.push({
    id: actionId++,
    priority: 'recommended',
    color: 'bg-brand-blue',
    title: 'Post at peak time',
    desc: 'Your best posting window starts in 45 minutes. Publish now for maximum engagement.',
    impact: '+40% reach',
    impactIcon: '📈',
    nav: 'create',
  });

  const aiActivitySummary = pendingTasks > 0
    ? `${pendingTasks} active AI task(s) · ${scheduledPosts} scheduled post(s)`
    : failedPostsThisMonth > 0
      ? `${failedPostsThisMonth} posting issue(s) detected this month`
      : 'AI monitored your accounts and prepared your next best actions';

  const recommendations = [
    { icon: '📅', bg: 'bg-purple-soft', text: scheduledPosts === 0 ? 'Schedule your weekly content' : 'Schedule posts', nav: 'create' },
    { icon: '💬', bg: 'bg-green-soft', text: failedPostsThisMonth > 0 ? 'Resolve posting errors' : 'Respond to reviews', nav: failedPostsThisMonth > 0 ? 'social' : 'chat-engagement-reviews' },
    { icon: '📈', bg: 'bg-orange-soft', text: tokenCount < 50 ? 'Increase token budget' : 'Increase campaign budget', nav: tokenCount < 50 ? 'tokens-packs' : 'campaigns' },
  ];

  return NextResponse.json({
    todaysActions: actions.slice(0, 5),
    aiActivitySummary,
    recommendations,
    stats: {
      tokenCount,
      connectedCount: connectedPlatforms.length,
      totalFollowers: connectedPlatforms.reduce((sum: number, account: DbSocialAccount) => sum + account.followers, 0),
      disconnectedPlatforms: disconnectedPlatforms.map((account: DbSocialAccount) => account.platform),
      scheduledPosts,
    },
  });
}
