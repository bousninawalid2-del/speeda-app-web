import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireN8nAuth } from '@/lib/n8n-guard';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';
import { resolveExistingUserId } from '@/lib/n8n-validate';
import { toUserIdString } from '@/lib/user-id';
import { traceLog } from '@/lib/trace';
import { normalizeN8nReply } from '@/lib/n8n-reply';

/**
 * POST /api/n8n/respond
 *
 * Receives async responses from n8n workflows and durably queues them so the
 * web chat frontend can poll for updates. Backed by the PendingChatResponse
 * table (not an in-memory Map) so messages survive restarts/redeploys and
 * work across multiple server instances.
 */

// reply/options are loosely typed on purpose: workflows built for WhatsApp
// sometimes push a raw WhatsApp Cloud API payload or an agent JSON string.
// normalizeN8nReply turns any of those into clean text + options.
const postSchema = z.object({
  sessionId: z.string().min(1),
  userId:    z.string().min(1),
  reply:     z.unknown(),
  type:      z.string().optional(),
  mediaUrl:  z.string().optional(),
  options:   z.unknown().optional(),
});

const TTL_MS = 60 * 60 * 1000; // drop unpolled/consumed rows after 1 hour

/**
 * POST — n8n pushes a response
 */
export async function POST(req: NextRequest) {
  const auth = requireN8nAuth(req);
  if (auth !== true) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { sessionId, reply: rawReply, type: rawType, mediaUrl: rawMediaUrl, options: rawOptions } = parsed.data;
  const normalized = normalizeN8nReply(rawReply, { type: rawType, mediaUrl: rawMediaUrl, options: rawOptions });
  // e.g. a WhatsApp reaction (👍 on the user's message): nothing to show on web.
  if (!normalized) return Response.json({ ok: true, skipped: true });
  const { reply, type, mediaUrl, options } = normalized;

  if (!rateLimit(`n8n:respond:${sessionId}`, { limit: 30, windowMs: 60_000 })) {
    return errorResponse('Too many responses for this session', 429);
  }

  const resolvedUserId = await resolveExistingUserId(parsed.data.userId);
  if (typeof resolvedUserId !== 'bigint') return resolvedUserId;

  await prisma.pendingChatResponse.create({
    data: {
      sessionId,
      userId: resolvedUserId,
      reply,
      type,
      mediaUrl,
      options: options ? JSON.stringify(options) : null,
    },
  });

  // Opportunistic cleanup — no dedicated cron/worker in this deployment yet.
  prisma.pendingChatResponse
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - TTL_MS) } } })
    .catch(() => {});

  traceLog('n8n.respond.push', sessionId, { type });

  return Response.json({ ok: true });
}

/**
 * GET /api/n8n/respond?sessionId=xxx
 *
 * Frontend polls this to get async responses from n8n. Requires the user's
 * own access token — a message is only ever returned to the user it belongs
 * to (bound by userId, not just the client-supplied sessionId), so a guessed
 * or leaked sessionId cannot be used to read another user's replies.
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return errorResponse('sessionId is required', 400);

  const pending = await prisma.pendingChatResponse.findMany({
    where: { sessionId, userId: user.sub, consumedAt: null },
    orderBy: { seq: 'asc' },
  });

  if (pending.length > 0) {
    await prisma.pendingChatResponse.updateMany({
      where: { id: { in: pending.map(p => p.id) } },
      data: { consumedAt: new Date() },
    });
    traceLog('n8n.respond.poll', sessionId, { userId: toUserIdString(user.sub), count: pending.length });
  }

  const messages = pending.map(p => ({
    reply: p.reply,
    type: p.type,
    mediaUrl: p.mediaUrl ?? undefined,
    options: p.options ? JSON.parse(p.options) : undefined,
    timestamp: p.createdAt.getTime(),
  }));

  return Response.json({ messages });
}
