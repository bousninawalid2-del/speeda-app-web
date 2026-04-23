import { prisma } from '@/lib/db';
import {
  AyrshareError,
  type AyrshareComment,
  type AyrshareDirectMessage,
  type AyrshareHistoryPost,
  type AyrshareReview,
  getComments,
  getDefaultProfileKey,
  getHistory,
  getMessages,
  getReviews,
} from '@/lib/ayrshare';

export async function resolveProfileKey(userId: string | bigint): Promise<string | undefined> {
  try {
    const id = typeof userId === 'bigint' ? userId : BigInt(userId);
    const dbUser = await prisma.user.findUnique({ where: { id }, select: { profileKey: true } });
    if (dbUser?.profileKey) return dbUser.profileKey;
  } catch {
    // fall through
  }
  return getDefaultProfileKey();
}

function cacheKey(userId: string | bigint, suffix: string): string {
  return `${String(userId)}::${suffix}`;
}

const TTL_MS = 45_000;
type CacheEntry<T> = { at: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();

async function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await fn();
  cache.set(key, { at: Date.now(), data: data as unknown });
  return data;
}

export function invalidateEngagementCache(userId: string | bigint) {
  const prefix = `${String(userId)}::`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

interface PostRef { id: string; platform: string; ayrshareId?: string }

function extractPostRefs(posts: AyrshareHistoryPost[]): PostRef[] {
  const refs: PostRef[] = [];
  for (const post of posts) {
    if (Array.isArray(post.postIds)) {
      for (const p of post.postIds) {
        if (p?.id || p?.postId) {
          refs.push({ id: String(p.id ?? p.postId), platform: String(p.platform ?? '').toLowerCase() });
        }
      }
    } else if (post.id) {
      const platforms = Array.isArray(post.platforms) ? post.platforms : [];
      if (platforms.length) {
        for (const p of platforms) refs.push({ id: String(post.id), platform: String(p).toLowerCase(), ayrshareId: String(post.id) });
      } else {
        refs.push({ id: String(post.id), platform: 'instagram', ayrshareId: String(post.id) });
      }
    }
  }
  return refs;
}

export async function fetchAllComments(userId: string | bigint, profileKey?: string): Promise<AyrshareComment[]> {
  return withCache(cacheKey(userId, 'comments'), async () => {
    const platforms = ['instagram', 'facebook'] as const;
    const postRefsByPlatform = await Promise.all(
      platforms.map(async (p) => {
        try {
          const history = await getHistory(p, profileKey, 10);
          return extractPostRefs(history).filter(r => !r.platform || r.platform === p).map(r => ({ ...r, platform: p }));
        } catch { return [] as PostRef[]; }
      }),
    );

    const allRefs = postRefsByPlatform.flat();
    const results = await Promise.allSettled(
      allRefs.map(async (ref) => {
        try {
          // Use Social Post ID with searchPlatformId when the ID looks like a platform id
          const useSearchPlatformId = !!ref.ayrshareId ? false : true;
          const comments = await getComments(ref.id, { platform: ref.platform, searchPlatformId: useSearchPlatformId, profileKey });
          return comments.map(c => ({ ...c, platform: c.platform ?? ref.platform, postId: c.postId ?? ref.id }));
        } catch {
          return [] as AyrshareComment[];
        }
      }),
    );

    const all = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
    // de-dup by commentId
    const seen = new Set<string>();
    const deduped: AyrshareComment[] = [];
    for (const c of all) {
      if (!c.commentId || seen.has(c.commentId)) continue;
      seen.add(c.commentId);
      deduped.push(c);
    }
    deduped.sort((a, b) => Date.parse(b.created ?? '') - Date.parse(a.created ?? ''));
    return deduped;
  });
}

export async function fetchAllReviews(userId: string | bigint, profileKey?: string): Promise<AyrshareReview[]> {
  return withCache(cacheKey(userId, 'reviews'), async () => {
    const [gmb, fb] = await Promise.allSettled([
      getReviews('gmb', profileKey),
      getReviews('facebook', profileKey),
    ]);
    const out: AyrshareReview[] = [];
    if (gmb.status === 'fulfilled') out.push(...gmb.value);
    if (fb.status === 'fulfilled') out.push(...fb.value);
    out.sort((a, b) => Date.parse(b.created ?? '') - Date.parse(a.created ?? ''));
    return out;
  });
}

export async function fetchAllReceivedMessages(userId: string | bigint, profileKey?: string): Promise<{ messages: AyrshareDirectMessage[]; messagingDisabled: boolean }> {
  return withCache(cacheKey(userId, 'messages'), async () => {
    let messagingDisabled = false;
    const results = await Promise.allSettled([
      getMessages('instagram', profileKey),
      getMessages('facebook', profileKey),
    ]);
    const messages: AyrshareDirectMessage[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        messages.push(...r.value);
      } else if (r.reason instanceof AyrshareError && r.reason.status === 400) {
        messagingDisabled = true;
      }
    }
    const received = messages.filter(m => (m.action ?? 'received') === 'received');
    received.sort((a, b) => Date.parse(b.created ?? '') - Date.parse(a.created ?? ''));
    return { messages: received, messagingDisabled };
  });
}

// ─── Normalisation to the existing frontend card shape ─────────────────────

function platformLabel(p?: string): string {
  const v = (p ?? '').toLowerCase();
  if (v.includes('instagram')) return 'Instagram';
  if (v === 'gmb' || v.includes('google')) return 'Google';
  if (v.includes('facebook')) return 'Facebook';
  if (v.includes('whatsapp')) return 'WhatsApp';
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : 'Instagram';
}

function relativeTime(iso?: string): string {
  if (!iso) return 'Just now';
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 'Just now';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function parseRating(r: unknown): number {
  if (typeof r === 'number') return r;
  if (typeof r !== 'string') return 0;
  const map: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, positive: 5, negative: 1 };
  if (map[r] !== undefined) return map[r];
  const n = Number(r);
  return Number.isFinite(n) ? n : 0;
}

export interface EngagementCard {
  id: string;
  name: string;
  emoji: string;
  platform: string;
  type: 'Comment' | 'Review' | 'DM';
  filter: 'Comments' | 'Reviews' | 'DMs';
  time: string;
  msg: string;
  ai: string;
  isNegative?: boolean;
  profileImage?: string;
  rawId: string;
  created: string;
  sourcePlatform: string;
}

export function commentToCard(c: AyrshareComment): EngagementCard {
  return {
    id: `cmt_${c.commentId}`,
    rawId: c.commentId,
    name: c.from?.name ?? 'Customer',
    emoji: '👍',
    platform: platformLabel(c.platform),
    sourcePlatform: (c.platform ?? 'instagram').toLowerCase(),
    type: 'Comment',
    filter: 'Comments',
    time: relativeTime(c.created),
    created: c.created ?? '',
    msg: c.comment ?? '',
    ai: '',
    profileImage: c.profileImageUrl,
  };
}

export function reviewToCard(r: AyrshareReview): EngagementCard {
  const rating = parseRating(r.rating);
  return {
    id: `rv_${r.id}`,
    rawId: r.id,
    name: r.reviewer?.name ?? 'Customer',
    emoji: rating >= 4 ? '⭐' : rating <= 2 && rating > 0 ? '⚠️' : '🌟',
    platform: platformLabel(r.platform),
    sourcePlatform: (r.platform ?? 'gmb').toLowerCase(),
    type: 'Review',
    filter: 'Reviews',
    time: relativeTime(r.created),
    created: r.created ?? '',
    msg: r.review ?? '',
    ai: r.reviewReply?.reply ?? '',
    isNegative: rating > 0 && rating <= 2,
    profileImage: r.reviewer?.profile,
  };
}

export function messageToCard(m: AyrshareDirectMessage): EngagementCard {
  return {
    id: `dm_${m.conversationId ?? m.id ?? m.created}`,
    rawId: m.id ?? m.conversationId ?? '',
    name: m.senderDetails?.name ?? 'Customer',
    emoji: '💬',
    platform: platformLabel(m.platform),
    sourcePlatform: (m.platform ?? 'instagram').toLowerCase(),
    type: 'DM',
    filter: 'DMs',
    time: relativeTime(m.created),
    created: m.created ?? '',
    msg: m.message ?? '',
    ai: '',
    profileImage: m.senderDetails?.profileImage,
  };
}
