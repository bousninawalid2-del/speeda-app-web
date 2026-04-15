import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const DISCUSSION_CODE_LENGTH = 8;
const MAX_REGENERATION_ATTEMPTS = 3;

/** Generate an 8-digit numeric user-facing discussion code. */
function generateDiscussionCode(): string {
  const maxExclusive = 10 ** DISCUSSION_CODE_LENGTH;
  return crypto.randomInt(0, maxExclusive).toString().padStart(DISCUSSION_CODE_LENGTH, '0');
}

/**
 * Generate a decimal-only key from 20 random bytes (160 bits of entropy).
 * The decimal string is typically around 48-49 digits.
 */
function generateDiscussionKey(): string {
  return BigInt(`0x${crypto.randomBytes(20).toString('hex')}`).toString(10);
}

export async function regenerateDiscussionCodeForUser(userId: bigint) {
  const existing = await prisma.userDiscussionCode.findUnique({ where: { userId }, select: { id: true } });

  for (let attempt = 0; attempt < MAX_REGENERATION_ATTEMPTS; attempt += 1) {
    const nextValues = {
      code: generateDiscussionCode(),
      key: generateDiscussionKey(),
    };

    try {
      if (!existing) {
        return await prisma.userDiscussionCode.create({
          data: {
            userId,
            ...nextValues,
          },
        });
      }

      return await prisma.userDiscussionCode.update({
        where: { userId },
        data: nextValues,
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
    }
  }

  throw new Error(
    `Failed to generate unique discussion code values after ${MAX_REGENERATION_ATTEMPTS} attempts`
  );
}
