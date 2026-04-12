import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from './auth-guard';

/**
 * Require admin role.
 * Returns the auth payload on success, or a 401/403 NextResponse on failure.
 */
export function requireAdmin(
  request: NextRequest
): { user: import('./jwt').AccessTokenPayload } | NextResponse {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return auth;
}
