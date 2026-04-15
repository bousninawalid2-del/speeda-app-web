export const ENGAGEMENT_FILTERS = ['All', 'Comments', 'DMs', 'Reviews'] as const;
export type EngagementFilter = (typeof ENGAGEMENT_FILTERS)[number];

export interface EngagementMessage {
  id: string;
  name: string;
  platform: string;
  type: string;
  filter: Exclude<EngagementFilter, 'All'>;
  time: string;
  msg: string;
  rating: number;
  existingReply: string | null;
  emoji: string;
}

export interface EngagementDMConversation {
  id: string;
  name: string;
  platform: string;
  avatar: string;
  unread: boolean;
  lastMsg: string;
  time: string;
  thread: Array<{ from: 'them' | 'us'; text: string; time: string }>;
}

export interface ChatEngagementMessage {
  id: string;
  name: string;
  platform: string;
  type: string;
  filter: Exclude<EngagementFilter, 'All'>;
  time: string;
  msg: string;
  ai: string;
  emoji: string;
  isNegative?: boolean;
}

function toObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function resolveTypeAndFilter(value: unknown): { type: string; filter: Exclude<EngagementFilter, 'All'> } {
  const normalized = toStringValue(value).toLowerCase();
  if (normalized.includes('review')) return { type: 'Review', filter: 'Reviews' };
  if (normalized.includes('dm') || normalized.includes('message')) return { type: 'DM', filter: 'DMs' };
  return { type: 'Comment', filter: 'Comments' };
}

function resolveEmoji(type: string): string {
  if (type === 'Review') return '🌟';
  if (type === 'DM') return '💬';
  return '👍';
}

function pickArray(payload: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeEngagementMessage(item: unknown, index: number): EngagementMessage {
  const raw = toObject(item);
  const { type, filter } = resolveTypeAndFilter(raw.type ?? raw.filter);
  const msg = toStringValue(raw.msg ?? raw.message ?? raw.text ?? raw.content);
  return {
    id: toStringValue(raw.id, `msg_${index}`),
    name: toStringValue(raw.name ?? raw.username ?? raw.author ?? raw.customerName, 'Customer'),
    platform: toStringValue(raw.platform ?? raw.network ?? raw.channel ?? raw.source, 'Instagram'),
    type,
    filter,
    time: toStringValue(raw.time ?? raw.createdAt ?? raw.timestamp, 'Just now'),
    msg,
    rating: toNumberValue(raw.rating, 0),
    existingReply: toStringValue(raw.existingReply ?? raw.reply ?? raw.response, '') || null,
    emoji: toStringValue(raw.emoji, resolveEmoji(type)),
  };
}

function normalizeThreadMessage(item: unknown, index: number): { from: 'them' | 'us'; text: string; time: string } {
  const raw = toObject(item);
  const from = toStringValue(raw.from).toLowerCase() === 'us' ? 'us' : 'them';
  return {
    from,
    text: toStringValue(raw.text ?? raw.msg ?? raw.message, ''),
    time: toStringValue(raw.time ?? raw.createdAt ?? raw.timestamp, `#${index + 1}`),
  };
}

function normalizeDMConversation(item: unknown, index: number): EngagementDMConversation {
  const raw = toObject(item);
  const thread = asArray(raw.thread ?? raw.messages).map(normalizeThreadMessage).filter((entry) => entry.text.trim() !== '');
  const lastMsg = toStringValue(raw.lastMsg ?? raw.lastMessage, thread[thread.length - 1]?.text ?? '');
  return {
    id: toStringValue(raw.id, `dm_${index}`),
    name: toStringValue(raw.name ?? raw.username ?? raw.customerName, 'Customer'),
    platform: toStringValue(raw.platform ?? raw.network ?? raw.channel ?? raw.source, 'Instagram'),
    avatar: toStringValue(raw.avatar ?? raw.emoji, '💬'),
    unread: Boolean(raw.unread),
    lastMsg,
    time: toStringValue(raw.time ?? raw.updatedAt ?? raw.timestamp, 'Just now'),
    thread,
  };
}

function normalizeChatMessage(item: unknown, index: number): ChatEngagementMessage {
  const raw = toObject(item);
  const { type, filter } = resolveTypeAndFilter(raw.type ?? raw.filter);
  const rating = toNumberValue(raw.rating, 0);
  return {
    id: toStringValue(raw.id, `feed_${index}`),
    name: toStringValue(raw.name ?? raw.username ?? raw.author ?? raw.customerName, 'Customer'),
    platform: toStringValue(raw.platform ?? raw.network ?? raw.channel ?? raw.source, 'Instagram'),
    type,
    filter,
    time: toStringValue(raw.time ?? raw.createdAt ?? raw.timestamp, 'Just now'),
    msg: toStringValue(raw.msg ?? raw.message ?? raw.text ?? raw.content),
    ai: toStringValue(raw.ai ?? raw.reply ?? raw.suggestedReply ?? raw.response, ''),
    emoji: toStringValue(raw.emoji, resolveEmoji(type)),
    isNegative: rating > 0 ? rating <= 2 : Boolean(raw.isNegative),
  };
}

export function getEngagementWebhookUrl(): string | null {
  if (process.env.N8N_ENGAGEMENT_WEBHOOK_URL) return process.env.N8N_ENGAGEMENT_WEBHOOK_URL;
  if (!process.env.N8N_BASE_URL) return null;

  try {
    return new URL('/webhook/engagement', process.env.N8N_BASE_URL).toString();
  } catch {
    return null;
  }
}

export async function fetchEngagementFromProvider(filter: EngagementFilter, discuCode: string) {
  const webhookUrl = getEngagementWebhookUrl();
  if (!webhookUrl || !discuCode) {
    throw new Error('Engagement provider unavailable');
  }

  const targetUrl = new URL(webhookUrl);
  targetUrl.searchParams.set('discu_code', discuCode);
  targetUrl.searchParams.set('filter', filter);

  const providerResponse = await fetch(targetUrl, { method: 'GET', cache: 'no-store' });
  if (!providerResponse.ok) {
    throw new Error('Engagement provider unavailable');
  }

  const payload = toObject(await providerResponse.json().catch(() => ({})));
  const messagesRaw = pickArray(payload, ['messages', 'engagement', 'items']);
  const dmsRaw = pickArray(payload, ['dmConversations', 'dms', 'conversations']);
  const chatRaw = pickArray(payload, ['engagementMessages', 'chatFeed', 'feed']);

  const messages = messagesRaw.map(normalizeEngagementMessage).filter((entry) => entry.msg.trim() !== '');
  const dmConversations = dmsRaw.map(normalizeDMConversation);
  const engagementMessages = (chatRaw.length > 0
    ? chatRaw.map(normalizeChatMessage)
    : [
        ...messages.map((message, index) => normalizeChatMessage({
          ...message,
          id: `msg_${index}`,
          ai: message.existingReply ?? '',
          isNegative: message.rating > 0 && message.rating <= 2,
        }, index)),
        ...dmConversations.map((dm, index) => normalizeChatMessage({
          id: `dm_${index}`,
          name: dm.name,
          platform: dm.platform,
          type: 'DM',
          filter: 'DMs',
          time: dm.time,
          msg: dm.lastMsg,
          ai: '',
          emoji: dm.avatar || '💬',
        }, messages.length + index)),
      ]).filter((entry) => entry.msg.trim() !== '');

  return { messages, dmConversations, engagementMessages };
}
