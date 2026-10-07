import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';
import { buildN8nPayload } from '@/lib/n8n-payload';
import { normalizeN8nReply } from '@/lib/n8n-reply';
import { traceLog } from '@/lib/trace';

/**
 * POST /api/chat
 *
 * Proxies chat messages to the n8n root webhook. The payload is built by
 * buildN8nPayload, shared with the WhatsApp webhook, so both channels reach
 * n8n in the same shape.
 *
 * Request:  { message, sessionId?, isInteractive?, interactiveTitle?, interactiveId?, mediaId?, mediaType? }
 * Response: { reply, type, mediaUrl?, sessionId, options? }
 */

const schema = z.object({
  message:          z.string().min(1).max(4000),
  sessionId:        z.string().optional(),
  isInteractive:    z.boolean().optional(),
  interactiveTitle: z.string().optional(),
  interactiveId:    z.string().optional(),
  mediaId:          z.string().optional(),
  mediaType:        z.enum(['image', 'voice', 'pdf']).optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  if (!rateLimit(`chat:${user.sub}`, { limit: 30, windowMs: 60_000 })) {
    return errorResponse('Too many messages. Please wait a moment.', 429);
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl === 'https://your-n8n-instance.com/webhook/speeda-chat') {
    return errorResponse('Chat service not configured', 503);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse('Invalid JSON', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 400);

  const { message, sessionId, isInteractive, interactiveTitle, interactiveId, mediaId, mediaType } = parsed.data;

  try {
    const resolvedSessionId = sessionId ?? `${user.sub}-${Date.now()}`;
    const n8nPayload = await buildN8nPayload({
      channel: 'web',
      userId: user.sub,
      sessionId: resolvedSessionId,
      message: {
        text: message,
        interactive: isInteractive ? { id: interactiveId, title: interactiveTitle } : null,
        media: mediaType && mediaId ? { type: mediaType, id: mediaId } : null,
      },
    });

    traceLog('chat.webhook.request', resolvedSessionId, { userId: user.sub.toString(), isInteractive: !!isInteractive, mediaType });

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[chat] n8n webhook error: ${res.status}`, errText);
      traceLog('chat.webhook.error', resolvedSessionId, { status: res.status });
      return errorResponse('Chat service unavailable', 502);
    }

    const data: unknown = await res.json().catch(() => ({}));

    // Reduce whatever n8n returned (text, agent JSON, raw WhatsApp payload)
    // to what the web chat renders.
    const normalized = normalizeN8nReply(data);

    traceLog('chat.webhook.response', resolvedSessionId, { type: normalized?.type ?? 'none' });

    return Response.json({
      reply: normalized?.reply ?? '',
      type: normalized?.type ?? 'text',
      mediaUrl: normalized?.mediaUrl,
      sessionId: resolvedSessionId,
      options: normalized?.options,
    });
  } catch (err) {
    console.error('[chat] n8n webhook exception', err);
    traceLog('chat.webhook.exception', sessionId ?? user.sub.toString(), { message: err instanceof Error ? err.message : String(err) });
    return errorResponse('Chat service unavailable', 502);
  }
}
