import { prisma } from './db';

export type AccessLevel = 'free_trial' | 'active' | 'past_due' | 'none';

export interface SubscriptionAccess {
  level:         AccessLevel;
  planName:      string | null;
  trialDaysLeft: number;
  hasAccess:     boolean; // true when trial or active
  tokenBalance:  number;
}

/**
 * Server-side subscription access check.
 * Use this in API routes that require an active plan.
 *
 * @example
 * const access = await checkSubscriptionAccess(userId);
 * if (!access.hasAccess) return NextResponse.json({ error: 'Subscription required' }, { status: 402 });
 */
export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionAccess> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialEndsAt:  true,
      tokenBalance: true,
      subscription: {
        include: { plan: { select: { name: true } } },
      },
    },
  });

  if (!user) {
    return { level: 'none', planName: null, trialDaysLeft: 0, hasAccess: false, tokenBalance: 0 };
  }

  const now = new Date();

  // 1. Active subscription
  if (user.subscription?.status === 'active' && user.subscription.currentPeriodEnd > now) {
    return {
      level:         'active',
      planName:      user.subscription.plan.name,
      trialDaysLeft: 0,
      hasAccess:     true,
      tokenBalance:  user.tokenBalance,
    };
  }

  // 2. Free trial
  if (user.trialEndsAt && user.trialEndsAt > now) {
    const daysLeft = Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / 86400000);
    return {
      level:         'free_trial',
      planName:      null,
      trialDaysLeft: daysLeft,
      hasAccess:     true,
      tokenBalance:  user.tokenBalance,
    };
  }

  // 3. Past due
  if (user.subscription?.status === 'past_due') {
    return {
      level:         'past_due',
      planName:      user.subscription.plan.name,
      trialDaysLeft: 0,
      hasAccess:     false,
      tokenBalance:  user.tokenBalance,
    };
  }

  // 4. No access
  return {
    level:         'none',
    planName:      null,
    trialDaysLeft: 0,
    hasAccess:     false,
    tokenBalance:  user.tokenBalance,
  };
}

/**
 * Start a free trial for a new user.
 * Call this in the registration flow.
 */
export async function startFreeTrial(userId: string): Promise<void> {
  const days = parseInt(process.env.FREE_TRIAL_DAYS ?? '14', 10);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + days);

  await prisma.user.update({
    where: { id: userId },
    data:  { trialEndsAt },
  });
}
