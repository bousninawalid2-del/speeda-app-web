import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify that the incoming request is from our n8n instance.
 * Uses the ADMIN_SECRET as a shared secret in the x-n8n-secret header.
 */
export function requireN8nAuth(request: NextRequest): true | NextResponse {
  const secret = request.headers.get('x-n8n-secret');
  const expected = process.env.ADMIN_SECRET;

  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return true;
}
