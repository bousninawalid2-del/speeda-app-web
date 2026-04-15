import crypto from 'crypto';
import { prisma } from '@/lib/db';

const DISCUSSION_CODE_LENGTH = 8;

/** Generate an 8-digit numeric user-facing discussion code. */
function generateDiscussionCode(): string {
  const maxExclusive = 10 ** DISCUSSION_CODE_LENGTH;
  return crypto.randomInt(0, maxExclusive).toString().padStart(DISCUSSION_CODE_LENGTH, '0');
}

/** Generate a 27-digit numeric-like secure key. */
function generateDiscussionKey(): string {
  const segment = () => crypto.randomInt(0, 1_000_000_000).toString().padStart(9, '0');
  return `${segment()}${segment()}${segment()}`;
}

export async function regenerateDiscussionCodeForUser(userId: string) {
  const nextValues = {
    code: generateDiscussionCode(),
    key: generateDiscussionKey(),
  };

  const existing = await prisma.userDiscussionCode.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!existing) {
    return prisma.userDiscussionCode.create({
      data: {
        userId,
        ...nextValues,
      },
    });
  }

  return prisma.userDiscussionCode.update({
    where: { userId },
    data: nextValues,
  });
}
