import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateOTP, errorResponse } from '@/lib/auth-guard';
import { sendVerificationEmail } from '@/lib/email';
import { startFreeTrial } from '@/lib/subscription-guard';
import { ensureN8nUserById } from '@/lib/sync-n8n';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }
    const { name, email, password, phone, referralCode } = parsed.data;

    // Check for existing account by email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse('An account with this email already exists', 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    let preRegisteredUserId: string | null = null;

    // Check for WhatsApp pre-registration by phone
    // Rule: phone exists + no password = WhatsApp pre-registration → complete it
    //       phone exists + has password = fully registered account → block
    if (phone) {
      const existingByPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingByPhone) {
        if (existingByPhone.password === null) {
          // WhatsApp pre-registered user, no password set yet → complete registration on this row
          preRegisteredUserId = existingByPhone.id;
        } else {
          // Account already fully registered with this phone → block
          return errorResponse('An account with this phone number already exists', 409);
        }
      }
    }

    // Validate referral code if provided
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      });
      if (referrer) referrerId = referrer.id;
    }

    // Update pre-registered row (WhatsApp) OR create a brand-new user
    const user = preRegisteredUserId
      ? await prisma.user.update({
          where: { id: preRegisteredUserId },
          data: { name, email, password: hashed, phone },
        })
      : await prisma.user.create({
          data: {
            name,
            email,
            password: hashed,
            phone,
            referredByCode: referralCode || null,
          },
        });

    // Create referral record if valid referrer found
    if (referrerId) {
      await prisma.referral.create({
        data: {
          referrerId,
          refereeId: user.id,
          tokensAwarded: 50,
          status: 'pending', // becomes 'completed' when email is verified
        },
      });
    }

    // Generate & save OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 min
    await prisma.verifyToken.create({
      data: { code, userId: user.id, expiresAt },
    });

    // Start free trial for new users (non-blocking)
    startFreeTrial(user.id).catch(console.error);

    // Fire-and-forget: create user in datatest so n8n sync always works
    ensureN8nUserById(user.id).catch(() => {});

    // Send verification email (don't block the response)
    sendVerificationEmail(email, name, code).catch(console.error);

    return NextResponse.json(
      { message: 'Account created. Check your email for a verification code.', userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    console.error('[register]', err);
    return errorResponse('Internal server error', 500);
  }
}