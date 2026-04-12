import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';
import { createTokenPurchaseLink } from '@/lib/mamopay';
import { PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE } from '@/lib/constants/payment';

const purchaseSchema = z.object({
  packageId: z.string().min(1),
});

/**
 * POST /api/billing/token-purchase
 * Creates a MamoPay one-time payment link for a token package.
 * Body: { packageId: string }
 * Returns: { checkoutUrl: string }
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.sub;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const pack = await prisma.tokenPackage.findFirst({
    where: { id: parsed.data.packageId, active: true },
  });
  if (!pack) return errorResponse('Token package not found', 404);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  if (!process.env.MAMOPAY_API_KEY) {
    return errorResponse(PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE, 502);
  }

  try {
    const link = await createTokenPurchaseLink({
      packName:   pack.name,
      amount:     pack.price,
      returnUrl:  `${appUrl}/dashboard/tokens?success=1`,
      cancelUrl:  `${appUrl}/dashboard/tokens?cancel=1`,
      externalId: `tok_${userId}_${pack.id}_${Date.now()}`,
    });

    return NextResponse.json({ checkoutUrl: link.url, linkId: link.id });
  } catch (err) {
    console.error('[billing/token-purchase] MamoPay error', err);
    return errorResponse('Failed to create payment link. Please try again.', 502);
  }
}
