import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, AccessTokenPayload } from './jwt';

/**
 * Extract and verify the Bearer token from the Authorization header.
 * Returns the payload on success, or a 401 NextResponse on failure.
 */
export function requireAuth(
  request: NextRequest
): { user: AccessTokenPayload } | NextResponse {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }
  const token = authHeader.slice(7);
  try {
    const user = verifyAccessToken(token);
    return { user };
  } catch {
    return NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 });
  }
}

/** Generate a cryptographically secure 6-digit numeric OTP */
export function generateOTP(): string {
  const crypto = require('crypto') as typeof import('crypto');
  return crypto.randomInt(100000, 1000000).toString();
}

/** Generate a secure random hex token (32 bytes = 64 hex chars) */
export function generateSecureToken(): string {
  const crypto = require('crypto') as typeof import('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/** Standard error response helper */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
