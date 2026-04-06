import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { errorResponse } from '@/lib/auth-guard';

/**
 * POST /api/n8n/respond
 *
 * Receives async responses from n8n workflows.
 * Stores them so the frontend can poll for updates.
 *
 * This is needed because n8n sub-workflows send responses via WhatsApp
 * but for web chat, we need to capture them here.
 */

const schema = z.object({
  sessionId: z.string().min(1),
  userId:    z.string().min(1),
  reply:     z.string(),
  type:      z.enum(['text', 'image', 'video', 'file']).default('text'),
  mediaUrl:  z.string().optional(),
  options:   z.array(z.object({
    id:    z.string(),
    title: z.string(),
  })).optional(),
});

// In-memory store for pending responses (keyed by sessionId)
// In production, replace with Redis or DB table
const pendingResponses = new Map<string, Array<{
  reply: string;
  type: string;
  mediaUrl?: string;
  options?: Array<{ id: string; title: string }>;
  timestamp: number;
}>>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000; // 10 min TTL
  for (const [key, msgs] of pendingResponses) {
    const fresh = msgs.filter(m => m.timestamp > cutoff);
    if (fresh.length === 0) pendingResponses.delete(key);
    else pendingResponses.set(key, fresh);
  }
}, 5 * 60 * 1000);

/**
 * POST — n8n pushes a response
 */
export async function POST(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { sessionId, reply, type, mediaUrl, options } = parsed.data;

  const queue = pendingResponses.get(sessionId) ?? [];
  queue.push({ reply, type, mediaUrl, options, timestamp: Date.now() });
  pendingResponses.set(sessionId, queue);

  return Response.json({ ok: true });
}

/**
 * GET /api/n8n/respond?sessionId=xxx
 *
 * Frontend polls this to get async responses from n8n.
 * Returns and clears all pending messages for the session.
 */
export async function GET(req: NextRequest) {
  // This endpoint is called by the frontend with Bearer auth, not n8n secret
  // We accept either auth method
  const secret = req.headers.get('x-n8n-secret');
  const bearer = req.headers.get('Authorization');

  if (!secret && !bearer) {
    return errorResponse('Unauthorized', 401);
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return errorResponse('sessionId is required', 400);

  const messages = pendingResponses.get(sessionId) ?? [];
  pendingResponses.delete(sessionId);

  return Response.json({ messages });
}
