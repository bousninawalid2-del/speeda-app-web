import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';
import { makeDiscussionCode } from '@/lib/discussion-code';

/**
 * POST /api/chat
 *
 * Proxies chat messages to an n8n webhook workflow with enriched user state.
 * n8n expects a full payload including user flags, activity, preferences, etc.
 *
 * Request:  { message, sessionId?, isInteractive?, interactiveTitle?, mediaId?, mediaType? }
 * Response: { reply, type, mediaUrl?, sessionId, options? }
 */

const schema = z.object({
  message:          z.string().min(1).max(4000),
  sessionId:        z.string().optional(),
  isInteractive:    z.boolean().optional(),
  interactiveTitle: z.string().optional(),
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

  const { message, sessionId, isInteractive, interactiveTitle, mediaId, mediaType } = parsed.data;
  const discussionCode = makeDiscussionCode(user.sub);

  try {
    // ── Fetch user state in parallel ───────────────────────────────────────
    const [dbUser, activity, preference, activeStrategy] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.sub },
        select: {
          id: true, name: true, email: true, phone: true,
          isVerified: true, tokenBalance: true, profileKey: true,
        },
      }),
      prisma.activity.findUnique({ where: { userId: user.sub } }),
      prisma.preference.findUnique({ where: { userId: user.sub } }),
      prisma.strategy.findFirst({
        where: { userId: user.sub, status: 'active' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const resolvedSessionId = sessionId ?? `${user.sub}-${Date.now()}`;

    // ── Build enriched payload matching n8n root workflow expectations ────
    const n8nPayload = {
      // Core identifiers
      phone:      dbUser?.phone ?? resolvedSessionId,
      user_id:    user.sub,
      session_id: resolvedSessionId,
      email:      user.email,
      username:   user.name ?? '',
      message,

      // Input type flags
      is_text:        !mediaType && !isInteractive,
      is_image:       mediaType === 'image',
      is_voice:       mediaType === 'voice',
      is_pdf:         mediaType === 'pdf',
      is_interactive: isInteractive ?? false,

      // Media IDs — raw IDs, same pattern as WhatsApp media IDs
      // n8n resolves the download URL based on source:
      //   web   → GET {APP_URL}/api/chat/upload?id={media_id}
      //   whatsapp → WhatsApp Business Cloud media download
      image_media_id:  mediaType === 'image' ? (mediaId ?? '') : '',
      voice_media_id:  mediaType === 'voice' ? (mediaId ?? '') : '',
      pdf_media_id:    mediaType === 'pdf'   ? (mediaId ?? '') : '',
      image_caption:   '',

      // Interactive message data
      interactive_title: interactiveTitle ?? '',

      // User state flags — n8n uses these for routing
      user_exist:       !!dbUser,
      token_valide:     (dbUser?.tokenBalance ?? 0) > 0,
      restapiRegister:  dbUser?.isVerified ?? false,
      activity_exist:   !!activity,
      preference_exist: !!preference,
      user_strategy:    !!activeStrategy,

      // Activity data (so n8n doesn't need to query separately)
      business_name:         activity?.business_name ?? '',
      business_description:  preference?.business_description ?? '',
      audience_target:       activity?.audience_target ?? '',

      // Preference data
      preference_text:       preference ? JSON.stringify(preference) : '',
      preferred_platforms:   preference?.preferred_platforms ?? '',

      // Conversation tracking
      wa_message_id: '',
      discu_code:    discussionCode,
      discu_key:     discussionCode,

      // Source channel — lets n8n know this is web chat, not WhatsApp
      source: 'web',
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[chat] n8n webhook error: ${res.status}`, errText);
      return errorResponse('Chat service unavailable', 502);
    }

    const data = await res.json();

    // n8n can return various shapes — normalize
    const reply    = data.reply ?? data.output ?? data.text ?? data.message ?? '';
    const type     = data.type ?? 'text';
    const outMedia = data.mediaUrl ?? data.imageUrl ?? data.videoUrl ?? data.fileUrl ?? undefined;

    // Interactive options (buttons/lists) from n8n
    const options = data.options ?? data.interactive_options ?? undefined;

    return Response.json({
      reply,
      type,
      mediaUrl: outMedia,
      sessionId: data.sessionId ?? resolvedSessionId,
      options,
    });
  } catch (err) {
    console.error('[chat] n8n webhook exception', err);
    return errorResponse('Chat service unavailable', 502);
  }
}
