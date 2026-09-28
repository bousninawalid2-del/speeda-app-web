import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse } from '@/lib/auth-guard';
import { toUserIdBigInt } from '@/lib/user-id';

/**
 * Parse a userId string into a BigInt without hitting the database.
 * Use for read paths where a malformed id should just 400, not 500.
 */
export function parseUserId(userId: string): bigint | NextResponse {
  try {
    return toUserIdBigInt(userId);
  } catch {
    return errorResponse('Invalid userId', 400);
  }
}

/**
 * Parse a userId and confirm the user actually exists.
 * Use before any n8n-triggered write so a malformed or stale userId
 * (e.g. a user deleted after an n8n workflow started) fails cleanly
 * instead of throwing a foreign-key error further down.
 */
export async function resolveExistingUserId(userId: string): Promise<bigint | NextResponse> {
  const parsed = parseUserId(userId);
  if (parsed instanceof NextResponse) return parsed;

  const user = await prisma.user.findUnique({ where: { id: parsed }, select: { id: true } });
  if (!user) return errorResponse('User not found', 404);

  return parsed;
}
