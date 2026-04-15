import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateOTP, errorResponse } from '@/lib/auth-guard';
import { sendVerificationEmail } from '@/lib/email';
import { startFreeTrial } from '@/lib/subscription-guard';
import { ensureN8nUserById } from '@/lib/sync-n8n';
import { toUserIdString } from '@/lib/user-id';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(5).max(30), // required to complete WhatsApp pre-registration
  referralCode: z.string().optional(),
});

function isTempWhatsAppEmail(email: string): boolean {
  // n8n WhatsApp pre-registration uses temp_<phone>@speeda.local
  const e = email.trim().toLowerCase();
  return e.endsWith('@speeda.local') && e.startsWith('temp_');
}

function isPreRegisteredWhatsAppUser(user: { email: string; password: string | null }): boolean {
  return user.password == null && isTempWhatsAppEmail(user.email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { name, email, password, phone, referralCode } = parsed.data;

    // 1) Look up by phone first (key for WhatsApp pre-registration completion)
    const existingByPhone = await prisma.user.findFirst({
      where: { phone },
      select: { id: true, email: true, password: true },
    });

    const hashed = await bcrypt.hash(password, 12);

    let userIdToUse: bigint | null = null;
    if (existingByPhone) {
      if (isPreRegisteredWhatsAppUser(existingByPhone)) {
        userIdToUse = existingByPhone.id;
      } else {
        // Phone belongs to a fully registered account
        return errorResponse('An account with this phone number already exists', 409);
      }
    }

    // 2) Email uniqueness check
    // Allow if the email is still the temp email of the same pre-registered user we're completing.
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingByEmail && existingByEmail.id !== userIdToUse) {
      return errorResponse('An account with this email already exists', 409);
    }

    // 3) Validate referral code if provided
    let referrerId: bigint | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      });
      if (referrer) referrerId = referrer.id;
    }

    // 4) Update pre-registered row OR create a new user
    const user = userIdToUse
      ? await prisma.user.update({
          where: { id: userIdToUse },
          data: {
            name,
            email,
            password: hashed,
            phone,
            referredByCode: referralCode || null,
          },
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

    // 5) Create referral record if valid referrer found
    if (referrerId) {
      await prisma.referral.create({
        data: {
          referrerId,
          refereeId: user.id,
          tokensAwarded: 50,
          status: 'pending',
        },
      });
    }

    // 6) Generate & save OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 min
    await prisma.verifyToken.create({
      data: { code, userId: user.id, expiresAt },
    });

    // 7) Start free trial for new users (non-blocking)
    startFreeTrial(user.id).catch(console.error);

    // 8) Fire-and-forget: create user in datatest so n8n sync always works
    ensureN8nUserById(user.id).catch(() => {});

    // 9) Send verification email (don't block the response)
    sendVerificationEmail(email, name, code).catch(console.error);

    return NextResponse.json(
      { message: 'Account created. Check your email for a verification code.', userId: toUserIdString(user.id) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[register]', err);
    return errorResponse('Internal server error', 500);
  }
}
