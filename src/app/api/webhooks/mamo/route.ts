import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookAuth, MamoWebhookPayload } from '@/lib/mamopay';
import { prisma } from '@/lib/db';

/**
 * POST /api/webhooks/mamo
 *
 * Handles MamoPay webhook events.
 * MamoPay sends a Bearer token in Authorization matching MAMOPAY_WEBHOOK_SECRET.
 *
 * Events handled:
 *   charge.succeeded     → record Payment, activate/renew subscription or credit tokens
 *   charge.failed        → record failed Payment
 *   subscription.succeeded → record Payment + renew period
 *   subscription.failed    → mark subscription past_due
 *   subscription.cancelled → mark subscription cancelled
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!verifyWebhookAuth(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: MamoWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[webhook/mamo]', payload.event, payload.id);

  try {
    switch (payload.event) {
      case 'charge.succeeded':
      case 'subscription.succeeded':
        await handleChargeSucceeded(payload);
        break;

      case 'charge.failed':
      case 'subscription.failed':
        await handleChargeFailed(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      default:
        // Unknown event — acknowledge without error
        break;
    }
  } catch (err) {
    console.error('[webhook/mamo] handler error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Parse external_id format: sub_{userId}_{planId}_{ts} or tok_{userId}_{packId}_{ts}
 */
function parseExternalId(externalId?: string): { type: 'sub' | 'tok' | null; userId: string | null; refId: string | null } {
  if (!externalId) return { type: null, userId: null, refId: null };
  const parts = externalId.split('_');
  if (parts.length < 3) return { type: null, userId: null, refId: null };
  const type = parts[0] as 'sub' | 'tok';
  const userId = parts[1];
  const refId = parts[2];
  return { type, userId, refId };
}

async function handleChargeSucceeded(payload: MamoWebhookPayload) {
  const { type, userId, refId } = parseExternalId(payload.external_id);
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (type === 'sub' && refId) {
    // Subscription payment — activate/renew subscription
    const plan = await prisma.plan.findUnique({ where: { id: refId } });
    if (!plan) return;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Upsert subscription
    await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        planId:              plan.id,
        status:              'active',
        currentPeriodStart:  now,
        currentPeriodEnd:    periodEnd,
        mamoSubscriptionId:  payload.link_id,
        cancelledAt:         null,
      },
      create: {
        userId,
        planId:              plan.id,
        status:              'active',
        billingType:         'monthly',
        currentPeriodStart:  now,
        currentPeriodEnd:    periodEnd,
        mamoSubscriptionId:  payload.link_id,
      },
    });

    // Refill tokens for the new period
    await prisma.user.update({
      where: { id: userId },
      data: { tokenBalance: { increment: plan.tokenCount }, tokenUsed: 0 },
    });

    // Record payment
    await prisma.payment.create({
      data: {
        userId,
        amount:            payload.amount,
        currency:          payload.currency,
        status:            'succeeded',
        type:              'subscription',
        providerPaymentId: payload.id,
        description:       `${plan.name} Plan subscription`,
        metadata:          JSON.stringify({ planName: plan.name, planId: plan.id }),
        idempotencyKey:    payload.id,
      },
    });

  } else if (type === 'tok' && refId) {
    // Token purchase
    const pack = await prisma.tokenPackage.findUnique({ where: { id: refId } });
    if (!pack) return;

    await prisma.user.update({
      where: { id: userId },
      data: { tokenBalance: { increment: pack.tokenCount } },
    });

    await prisma.tokenLog.create({
      data: {
        userId,
        description: `Purchased ${pack.name}`,
        tokens:      pack.tokenCount,
        agent:       'Purchase',
      },
    });

    await prisma.payment.create({
      data: {
        userId,
        amount:            payload.amount,
        currency:          payload.currency,
        status:            'succeeded',
        type:              'token_purchase',
        providerPaymentId: payload.id,
        description:       pack.name,
        metadata:          JSON.stringify({ packName: pack.name, tokens: pack.tokenCount }),
        idempotencyKey:    payload.id,
      },
    });
  }
}

async function handleChargeFailed(payload: MamoWebhookPayload) {
  const { type, userId, refId } = parseExternalId(payload.external_id);
  if (!userId) return;

  // Record the failure — idempotencyKey prevents duplicates
  await prisma.payment.upsert({
    where: { idempotencyKey: payload.id },
    update: { status: 'failed' },
    create: {
      userId,
      amount:            payload.amount,
      currency:          payload.currency,
      status:            'failed',
      type:              type === 'tok' ? 'token_purchase' : 'subscription',
      providerPaymentId: payload.id,
      description:       'Payment failed',
      idempotencyKey:    payload.id,
    },
  });

  if (type === 'sub') {
    await prisma.userSubscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'past_due' },
    });
  }
}

async function handleSubscriptionCancelled(payload: MamoWebhookPayload) {
  const { userId } = parseExternalId(payload.external_id);
  if (!userId) return;

  await prisma.userSubscription.updateMany({
    where: { userId, mamoSubscriptionId: payload.link_id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
}
