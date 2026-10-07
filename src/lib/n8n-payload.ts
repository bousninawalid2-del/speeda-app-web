import { prisma } from '@/lib/db';
import { regenerateDiscussionCodeForUser } from '@/lib/discussion-code';
import { toUserIdString } from '@/lib/user-id';

/**
 * Single builder for the payload posted to the n8n root webhook.
 *
 * WhatsApp (via /api/webhooks/whatsapp) and the web chat (via /api/chat)
 * used to build this payload separately, with different keys and different
 * meanings for the same routing flags. Both now go through here, so n8n
 * receives one shape regardless of channel; only `channel` differs.
 */

export type N8nChannel = 'web' | 'whatsapp';

export interface N8nInboundMessage {
  text?: string | null;
  interactive?: { id?: string | null; title?: string | null } | null;
  media?: {
    type: 'image' | 'voice' | 'pdf';
    id: string;
    filename?: string | null;
    caption?: string | null;
  } | null;
  /** WhatsApp message id (used by n8n for reactions/replies); empty on web. */
  externalMessageId?: string | null;
}

interface UserFlagsInput {
  id: bigint;
  password: string | null;
  isVerified: boolean;
}

/**
 * Routing flags read by the n8n root workflow (If nodes, strict booleans):
 * - user_exist:      has a Speeda platform account (not just a WhatsApp contact)
 * - token_valide:    has signed in to the platform. On web the request is
 *                    authenticated, so always true. On WhatsApp: a live web
 *                    session exists (a refresh token, created on sign-in).
 * - restapiRegister: one-time post-registration welcome. No reliable one-shot
 *                    marker exists yet, so it stays false on both channels
 *                    (sending isVerified made every web message re-trigger
 *                    the welcome workflow).
 */
export async function computeUserFlags(user: UserFlagsInput, channel: N8nChannel) {
  const userExist = !!user.password?.trim() || user.isVerified;
  const [activityCount, preferenceCount, activeStrategyCount, sessionCount] = await Promise.all([
    prisma.activity.count({ where: { userId: user.id } }),
    prisma.preference.count({ where: { userId: user.id } }),
    prisma.strategy.count({ where: { userId: user.id, status: 'active' } }),
    channel === 'web' ? Promise.resolve(1) : prisma.refreshToken.count({ where: { userId: user.id } }),
  ]);

  return {
    user_exist: userExist,
    token_valide: userExist && sessionCount > 0,
    restapiRegister: false,
    activity_exist: activityCount > 0,
    preference_exist: preferenceCount > 0,
    user_strategy: activeStrategyCount > 0,
  };
}

function preferenceSummary(pref: { resumer: string | null; preferred_platforms: string | null } | null): string {
  if (!pref) return '';
  const parts: string[] = [];
  if (pref.resumer?.trim()) parts.push(pref.resumer.trim());
  if (pref.preferred_platforms?.trim()) parts.push(`Preferred Platforms: ${pref.preferred_platforms.trim()}`);
  return parts.join('\n\n');
}

export async function buildN8nPayload(opts: {
  channel: N8nChannel;
  userId: bigint;
  sessionId: string;
  message: N8nInboundMessage;
}) {
  const { channel, userId, sessionId, message } = opts;

  const [user, activity, preference, existingCode] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, password: true, isVerified: true },
    }),
    prisma.activity.findUnique({ where: { userId } }),
    prisma.preference.findUnique({ where: { userId } }),
    prisma.userDiscussionCode.findUnique({ where: { userId } }),
  ]);
  const discussion = existingCode ?? (await regenerateDiscussionCodeForUser(userId));
  const flags = await computeUserFlags(user, channel);

  const interactiveTitle = message.interactive?.title?.trim() || '';
  const interactiveId = message.interactive?.id?.trim() || '';
  const media = message.media ?? null;
  const text = message.text?.trim() || '';
  const messageText = text || interactiveTitle || media?.caption || '';

  // n8n keys its conversation memory on `phone`. Web users without a phone
  // fall back to the chat session so each web conversation keeps its own
  // memory (the previous web behaviour).
  const phone = user.phone ?? (channel === 'web' ? sessionId : '');
  const userIdStr = toUserIdString(user.id);

  return {
    // ── Unified model (channel-agnostic entry point for n8n) ──
    channel,
    source: channel,
    normalized: {
      channel,
      userId: userIdStr,
      sessionId,
      messageText,
      metadata: {
        phoneNumber: user.phone ?? null,
        webSessionId: channel === 'web' ? sessionId : null,
      },
    },

    // ── Identity ──
    user_id: userIdStr,
    session_id: sessionId,
    phone,
    email: user.email,
    username: user.name ?? '',

    // ── Message ──
    message: messageText,
    is_text: !!text && !media && !interactiveTitle,
    is_image: media?.type === 'image',
    is_voice: media?.type === 'voice',
    is_pdf: media?.type === 'pdf',
    is_interactive: !!interactiveTitle,
    image_media_id: media?.type === 'image' ? media.id : '',
    voice_media_id: media?.type === 'voice' ? media.id : '',
    pdf_media_id: media?.type === 'pdf' ? media.id : '',
    image_caption: media?.type === 'image' ? media.caption ?? '' : '',
    voice_filename: media?.type === 'voice' ? media.filename ?? '' : '',
    pdf_filename: media?.type === 'pdf' ? media.filename ?? '' : '',
    interactive_title: interactiveTitle,
    interactive_id: interactiveId,
    wa_message_id: message.externalMessageId ?? '',

    // ── Routing flags (identical computation on both channels) ──
    ...flags,

    // ── Business profile ──
    activity_id: activity ? activity.id.toString() : '',
    business_name: activity?.business_name ?? '',
    industry: activity?.industry ?? '',
    business_description: activity?.business_description ?? '',
    location: activity?.location ?? '',
    opening_hours: activity?.opening_hours ?? '',
    audience_target: activity?.audience_target ?? '',
    business_size: activity?.business_size ?? '',
    unique_selling_point: activity?.unique_selling_point ?? '',
    year_founded: activity?.year_founded ?? '',
    certifications: activity?.certifications ?? '',
    resumer: activity?.resumer ?? '',
    activity_text: activity?.resumer ?? '',

    // ── Brand preferences ──
    preference_id: preference ? preference.id.toString() : '',
    preference_text: preferenceSummary(preference),
    preferred_platforms: preference?.preferred_platforms ?? '',
    tone_of_voice: preference?.tone_of_voice ?? '',
    language_preference: preference?.language_preference ?? '',
    resumer_preference: preference?.resumer ?? '',

    // ── Conversation tracking ──
    discu_code: discussion.code,
    discu_key: discussion.key,
  };
}
