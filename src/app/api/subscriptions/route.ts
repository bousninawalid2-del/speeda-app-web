import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';
import { createSubscriptionLink, cancelSubscription } from '@/lib/mamopay';

const createSchema = z.object({
  planId:      z.string().min(1),
  billingType: z.enum(['monthly', 'yearly']),
});

/**
 * GET /api/subscriptions
 * Returns the current user's subscription + plan info (or null if none).
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  // Determine trial status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true },
  });

  const now = new Date();
  const trialActive = user?.trialEndsAt ? user.trialEndsAt > now : false;
  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / 86400000))
    : 0;

  return NextResponse.json({
    subscription: subscription
      ? {
          id:                  subscription.id,
          status:              subscription.status,
          billingType:         subscription.billingType,
          currentPeriodStart:  subscription.currentPeriodStart,
          currentPeriodEnd:    subscription.currentPeriodEnd,
          cancelledAt:         subscription.cancelledAt,
          plan: {
            id:           subscription.plan.id,
            name:         subscription.plan.name,
            monthlyPrice: subscription.plan.monthlyPrice,
            yearlyPrice:  subscription.plan.yearlyPrice,
            tokenCount:   subscription.plan.tokenCount,
            features:     JSON.parse(subscription.plan.features),
            locked:       JSON.parse(subscription.plan.locked),
            watermark:    subscription.plan.watermark,
            popular:      subscription.plan.popular,
          },
        }
      : null,
    trial: { active: trialActive, daysLeft: trialDaysLeft },
  });
}

/**
 * POST /api/subscriptions
 * Creates a MamoPay checkout URL for the selected plan.
 * Body: { planId: string; billingType: 'monthly' | 'yearly' }
 * Returns: { checkoutUrl: string }
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { planId, billingType } = parsed.data;

  const plan = await prisma.plan.findFirst({
    where: { id: planId, active: true },
  });
  if (!plan) return errorResponse('Plan not found', 404);

  const amount = billingType === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const link = await createSubscriptionLink({
      planName:    plan.name,
      amount,
      billingType,
      returnUrl:   `${appUrl}/dashboard/subscription?success=1&planId=${plan.id}&billing=${billingType}`,
      externalId:  `sub_${userId}_${plan.id}_${Date.now()}`,
    });

    return NextResponse.json({ checkoutUrl: link.url, linkId: link.id });
  } catch (err) {
    console.error('[subscriptions] MamoPay error', err);
    return errorResponse('Failed to create payment link. Please try again.', 502);
  }
}

/**
 * DELETE /api/subscriptions
 * Cancels the current subscription at period end.
 */
export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  const subscription = await prisma.userSubscription.findUnique({ where: { userId } });
  if (!subscription) return errorResponse('No active subscription', 404);

  // Cancel with MamoPay if we have an external subscription ID
  if (subscription.mamoSubscriptionId) {
    try {
      await cancelSubscription(subscription.mamoSubscriptionId);
    } catch (err) {
      console.error('[subscriptions] cancel error', err);
      // Don't block the user — mark cancelled locally regardless
    }
  }

  await prisma.userSubscription.update({
    where: { userId },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });

  return NextResponse.json({ ok: true, message: 'Subscription cancelled. Access continues until period end.' });
}
