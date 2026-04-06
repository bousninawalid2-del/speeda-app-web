import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateSecureToken, errorResponse } from '@/lib/auth-guard';
import { sendMagicLinkEmail } from '@/lib/email';

const sendSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({ token: z.string() });

/**
 * POST /api/auth/quick-login
 * Step 1 — send a magic link to the user's email.
 * If no account exists with that email, one is created (unverified → auto-verified via magic link).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
    const { email } = parsed.data;

    // Rate-limit: 1 request per 60s
    const recent = await prisma.magicToken.findFirst({
      where: {
        user: { email },
        used: false,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recent) {
      return errorResponse('Please wait 60 seconds before requesting another link.', 429);
    }

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, isVerified: true } });
    }

    const token = generateSecureToken();
    await prisma.magicToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    sendMagicLinkEmail(email, user.name ?? '', token).catch(console.error);

    return NextResponse.json({ message: 'Magic link sent to your email.' });
  } catch (err) {
    console.error('[quick-login send]', err);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * PUT /api/auth/quick-login
 * Step 2 — verify the magic link token and return JWT pair.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const record = await prisma.magicToken.findUnique({
      where: { token: parsed.data.token },
      include: { user: true },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      return errorResponse('Magic link is invalid or has expired.', 400);
    }

    await prisma.magicToken.update({ where: { id: record.id }, data: { used: true } });

    // Auto-verify account if not already
    if (!record.user.isVerified) {
      await prisma.user.update({ where: { id: record.userId }, data: { isVerified: true } });
    }

    const { issueTokens } = await import('../login/route');
    return issueTokens(record.user);
  } catch (err) {
    console.error('[quick-login verify]', err);
    return errorResponse('Internal server error', 500);
  }
}
