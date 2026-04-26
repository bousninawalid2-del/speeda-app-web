/**
 * Ayrshare API client — server-side only.
 * Docs: https://docs.ayrshare.com
 *
 * Used here for:
 *  1. Social analytics  — followers, engagement per platform
 *  2. Post analytics    — impressions/clicks for specific post IDs
 *  3. Profile management — create user profiles, generate Max linking URLs
 *  4. Platform management — get connected platforms, disconnect
 *
 * All calls gracefully return null on misconfiguration so the app
 * degrades to DB-only data without crashing.
 */

const BASE = 'https://api.ayrshare.com/api';


function apiHeaders(profileKey?: string | null, includeTwitter = false): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
    'Content-Type': 'application/json',
  };
  if (profileKey) h['Profile-Key'] = profileKey;
  if (includeTwitter && process.env.X_TWITTER_API_KEY && process.env.X_TWITTER_API_SECRET) {
    h['X-Twitter-OAuth1-Api-Key']    = process.env.X_TWITTER_API_KEY;
    h['X-Twitter-OAuth1-Api-Secret'] = process.env.X_TWITTER_API_SECRET;
  }
  return h;
}

function isConfigured(): boolean {
  const key = process.env.AYRSHARE_API_KEY;
  return !!key && key !== 'your-ayrshare-api-key';
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialPlatformStats {
  followers?: number;
  impressions?: number;
  engagementRate?: number;
}

export type SocialAnalytics = Partial<Record<string, SocialPlatformStats>>;

export interface PostAnalyticsResult {
  postId: string;
  impressions: number;
  reach: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
}

// ─── Social analytics (per connected profile) ────────────────────────────────

/**
 * Returns aggregated social analytics for the connected platforms.
 * Used to enrich the "Total Reach" summary card.
 */
export async function getSocialAnalytics(
  platforms: string[],
  profileKey?: string | null,
): Promise<SocialAnalytics | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${BASE}/analytics/social`, {
      method: 'POST',
      headers: apiHeaders(profileKey),
      body: JSON.stringify({ platforms }),
      next: { revalidate: 300 }, // cache 5 min
    });
    if (!res.ok) return null;
    return res.json() as Promise<SocialAnalytics>;
  } catch {
    return null;
  }
}

// ─── Profile management ───────────────────────────────────────────────────────

/**
 * Creates a new Ayrshare profile for the user and returns the profileKey.
 * Call once when the user first links a social account.
 */
export async function createProfile(
  title: string,
): Promise<{ profileKey: string; id: string } | null> {
  if (!isConfigured()) {
    console.error('[ayrshare:createProfile] API key not configured');
    return null;
  }
  try {
    const res = await fetch(`${BASE}/profiles`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[ayrshare:createProfile] ${res.status} ${res.statusText}`, body);
      return null;
    }
    const data = await res.json() as { profileKey: string; id: string };
    return { profileKey: data.profileKey, id: data.id };
  } catch (err) {
    console.error('[ayrshare:createProfile] exception', err);
    return null;
  }
}

/**
 * Generates a Max social-linking URL (JWT) the user opens to connect accounts.
 * Uses the Ayrshare Business private key for JWT generation.
 * Returns the URL string, or null on failure.
 */
export async function generateLinkingUrl(profileKey: string): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const privateKey = process.env.AYRSHARE_PRIVATE_KEY;
    const domain = process.env.AYRSHARE_DOMAIN ?? 'id-9Bl9T';

    const body = new URLSearchParams();
    body.append('domain', domain);
    if (profileKey) body.append('profileKey', profileKey);
    if (privateKey) body.append('privateKey', privateKey);

    const res = await fetch(`${BASE}/profiles/generateJWT`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[ayrshare:generateLinkingUrl] ${res.status}`, errText);
      return null;
    }
    const data = await res.json() as { url?: string };
    return data.url ?? null;
  } catch (err) {
    console.error('[ayrshare:generateLinkingUrl] exception', err);
    return null;
  }
}

/**
 * Returns the platforms currently connected under the user's Ayrshare profile.
 * Shape: { instagram: { username, followers }, tiktok: {...}, ... }
 */
export async function getConnectedPlatforms(
  profileKey: string,
): Promise<Record<string, { username?: string; followers?: number }> | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${BASE}/user`, {
      headers: apiHeaders(profileKey),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.platforms && Object.keys(data.platforms).length > 0) {
      return Object.fromEntries(Object.entries(data.platforms).map(([s, i]) => [s.toLowerCase(), { username: i.username, followers: i.followers || 0 }]));
    }
    if (Array.isArray(data.activeSocialAccounts) && data.activeSocialAccounts.length > 0) {
      return Object.fromEntries(data.activeSocialAccounts.map((s) => [s.toLowerCase(), {}]));
    }
    return {};
  } catch {
    return null;
  }
}

// ─── Publish post via Ayrshare ───────────────────────────────────────────────

export interface AyrsharePostInput {
  post: string;                   // caption text
  platforms: string[];            // ['instagram', 'facebook', ...]
  mediaUrls?: string[];           // public URLs to images/videos
  scheduleDate?: string;          // ISO 8601 for scheduled posts
  profileKey?: string;
}

export interface AyrsharePostResult {
  id: string;                     // Ayrshare post ID
  postIds?: Record<string, string>; // per-platform IDs
  status: string;
}

/**
 * Publish or schedule a post to social platforms via Ayrshare.
 * Returns the Ayrshare post ID on success, null on failure.
 */
export async function publishPost(input: AyrsharePostInput): Promise<AyrsharePostResult | null> {
  if (!isConfigured()) {
    console.error('[ayrshare:publishPost] API key not configured');
    return null;
  }
  try {
    const body: Record<string, unknown> = {
      post: input.post,
      platforms: input.platforms,
    };
    if (input.mediaUrls?.length) body.mediaUrls = input.mediaUrls;
    if (input.scheduleDate) body.scheduleDate = input.scheduleDate;

    const res = await fetch(`${BASE}/post`, {
      method: 'POST',
      headers: apiHeaders(input.profileKey, input.platforms.includes('twitter')),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('[ayrshare:publishPost] failed', {
        status: res.status,
        statusText: res.statusText,
        platforms: input.platforms,
        scheduleDate: input.scheduleDate ?? null,
        responseText: errBody,
      });
      return null;
    }

    const data = await res.json() as AyrsharePostResult;
    return data;
  } catch (err) {
    console.error('[ayrshare:publishPost] exception', err);
    return null;
  }
}

/**
 * Delete a published post from Ayrshare.
 */
export async function deleteAyrsharePost(postId: string, profileKey?: string): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${BASE}/post`, {
      method: 'DELETE',
      headers: apiHeaders(profileKey),
      body: JSON.stringify({ id: postId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Engagement: comments, reviews, DMs ──────────────────────────────────────

export class AyrshareError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'AyrshareError';
  }
}

function mapErrorCode(status: number): string {
  if (status === 401) return 'unauthorized';
  if (status === 400) return 'bad_request';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  return 'ayrshare_error';
}

export async function engagementFetch<T>(
  path: string,
  opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; profileKey?: string | null; searchParams?: Record<string, string | number | boolean | undefined>; } = {},
): Promise<T> {
  if (!isConfigured()) throw new AyrshareError(500, 'no_api_key', 'AYRSHARE_API_KEY is not configured');
  const url = new URL(`${BASE}${path.startsWith('/') ? path : `/${path}`}`);
  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: apiHeaders(opts.profileKey ?? undefined),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data: unknown = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

  if (!res.ok) {
    const msg = (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string')
      ? (data as { message: string }).message
      : `Ayrshare request failed (${res.status})`;
    throw new AyrshareError(res.status, mapErrorCode(res.status), msg);
  }
  return data as T;
}

export interface AyrshareHistoryPost {
  id?: string;
  postIds?: Array<{ postUrl?: string; platform?: string; id?: string; postId?: string; status?: string }>;
  post?: string;
  created?: string;
  platforms?: string[];
  status?: string;
  [k: string]: unknown;
}

export async function getHistory(platform: string, profileKey?: string | null, lastRecords = 10): Promise<AyrshareHistoryPost[]> {
  const data = await engagementFetch<AyrshareHistoryPost[] | { posts?: AyrshareHistoryPost[] }>(`/history`, {
    searchParams: { platform, lastRecords },
    profileKey,
  });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.posts)) return data.posts;
  return [];
}

export interface AyrshareComment {
  commentId: string;
  comment: string;
  created: string;
  from?: { id?: string; name?: string };
  likeCount?: number;
  platform?: string;
  profileImageUrl?: string;
  replies?: AyrshareComment[];
  postId?: string;
  [k: string]: unknown;
}

export async function getComments(
  postId: string,
  opts: { platform?: string; searchPlatformId?: boolean; profileKey?: string | null } = {},
): Promise<AyrshareComment[]> {
  const data = await engagementFetch<AyrshareComment[] | { comments?: AyrshareComment[] }>(`/comments/${encodeURIComponent(postId)}`, {
    searchParams: { platform: opts.platform, searchPlatformId: opts.searchPlatformId },
    profileKey: opts.profileKey,
  });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.comments)) return data.comments;
  return [];
}

export async function replyToComment(params: {
  commentId: string; platforms: string[]; comment: string; profileKey?: string | null;
}) {
  return engagementFetch(`/comments/reply`, {
    method: 'POST',
    body: { commentId: params.commentId, platforms: params.platforms, comment: params.comment },
    profileKey: params.profileKey,
  });
}

export interface AyrshareReview {
  id: string;
  review: string;
  rating?: string | number;
  reviewer?: { name?: string; profile?: string };
  created: string;
  reviewReply?: { reply?: string; updated?: string } | null;
  platform?: string;
  [k: string]: unknown;
}

export async function getReviews(platform: 'gmb' | 'facebook', profileKey?: string | null): Promise<AyrshareReview[]> {
  const data = await engagementFetch<AyrshareReview[] | { reviews?: AyrshareReview[] }>(`/reviews`, {
    searchParams: { platform },
    profileKey,
  });
  const list = Array.isArray(data) ? data : Array.isArray(data?.reviews) ? data!.reviews! : [];
  return list.map(r => ({ ...r, platform: r.platform ?? platform }));
}

export async function replyToReview(params: {
  reviewId: string; reply: string; platform: 'gmb' | 'facebook'; profileKey?: string | null;
}) {
  return engagementFetch(`/reviews`, {
    method: 'POST',
    body: { reviewId: params.reviewId, reply: params.reply, platform: params.platform },
    profileKey: params.profileKey,
  });
}

export interface AyrshareDirectMessage {
  id?: string;
  message: string;
  senderId?: string;
  senderDetails?: { name?: string; profileImage?: string };
  conversationId?: string;
  created: string;
  action?: 'sent' | 'received';
  platform?: string;
  [k: string]: unknown;
}

export async function getMessages(
  platform: 'instagram' | 'facebook',
  profileKey?: string | null,
): Promise<AyrshareDirectMessage[]> {
  const data = await engagementFetch<AyrshareDirectMessage[] | { messages?: AyrshareDirectMessage[] }>(`/messages/${platform}`, {
    profileKey,
  });
  const list = Array.isArray(data) ? data : Array.isArray(data?.messages) ? data!.messages! : [];
  return list.map(m => ({ ...m, platform: m.platform ?? platform }));
}

export function getDefaultProfileKey(): string | undefined {
  return process.env.AYRSHARE_PROFILE_KEY || undefined;
}

// ─── User profile (connected platforms, display names) ───────────────────────

export interface AyrshareDisplayName {
  platform: string;
  displayName?: string;
  userImage?: string;
  username?: string;
  usedQuota?: number;
  created?: string;
  messagingActive?: boolean;
  refreshDaysRemaining?: number;
  [k: string]: unknown;
}

export interface AyrshareUserProfile {
  activeSocialAccounts: string[];
  displayNames: AyrshareDisplayName[];
  [k: string]: unknown;
}

export async function getUserProfile(profileKey?: string | null): Promise<AyrshareUserProfile> {
  const data = await engagementFetch<Record<string, unknown>>(`/user`, { profileKey });
  const activeSocialAccounts = Array.isArray(data?.activeSocialAccounts)
    ? (data.activeSocialAccounts as unknown[]).map((s) => String(s).toLowerCase())
    : [];
  const displayNames = Array.isArray(data?.displayNames)
    ? (data.displayNames as AyrshareDisplayName[])
    : [];
  return { ...data, activeSocialAccounts, displayNames };
}

// ─── RSS / Feeds ─────────────────────────────────────────────────────────────

export interface AyrshareFeed {
  id: string;
  url: string;
  type?: string;
  status?: string;
  platforms?: string[];
  lastItem?: { title?: string; link?: string; pubDate?: string } | null;
  title?: string;
  active?: boolean;
  useFirstImage?: boolean;
  autoHashtag?: boolean;
  [k: string]: unknown;
}

export async function listFeeds(profileKey?: string | null): Promise<AyrshareFeed[]> {
  const data = await engagementFetch<AyrshareFeed[] | { feeds?: AyrshareFeed[] }>(`/feed`, { profileKey });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as { feeds?: AyrshareFeed[] }).feeds)) return (data as { feeds: AyrshareFeed[] }).feeds;
  return [];
}

export async function addFeed(params: {
  url: string;
  platforms?: string[];
  useFirstImage?: boolean;
  autoHashtag?: boolean;
  profileKey?: string | null;
}) {
  return engagementFetch<AyrshareFeed>(`/feed`, {
    method: 'POST',
    body: {
      url: params.url,
      type: 'rss',
      ...(params.platforms?.length ? { platforms: params.platforms } : {}),
      ...(params.useFirstImage !== undefined ? { useFirstImage: params.useFirstImage } : {}),
      ...(params.autoHashtag !== undefined ? { autoHashtag: params.autoHashtag } : {}),
    },
    profileKey: params.profileKey,
  });
}

export async function updateFeed(params: {
  id: string;
  useFirstImage?: boolean;
  autoHashtag?: boolean;
  platforms?: string[];
  profileKey?: string | null;
}) {
  const { id, profileKey, ...rest } = params;
  return engagementFetch<AyrshareFeed>(`/feed`, {
    method: 'PUT',
    body: { id, ...rest },
    profileKey,
  });
}

export async function deleteFeed(params: { id: string; profileKey?: string | null }) {
  return engagementFetch<{ status?: string }>(`/feed`, {
    method: 'DELETE',
    body: { id: params.id },
    profileKey: params.profileKey,
  });
}

// ─── Auto-Schedule ───────────────────────────────────────────────────────────

export interface AyrshareAutoSchedule {
  title: string;
  schedule: string[];
  daysOfWeek?: number[];
  excludeDates?: string[];
  [k: string]: unknown;
}

export async function listAutoSchedules(profileKey?: string | null): Promise<AyrshareAutoSchedule[]> {
  const data = await engagementFetch<AyrshareAutoSchedule[] | { schedules?: AyrshareAutoSchedule[] }>(
    `/auto-schedule/list`,
    { profileKey },
  );
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as { schedules?: AyrshareAutoSchedule[] }).schedules)) {
    return (data as { schedules: AyrshareAutoSchedule[] }).schedules;
  }
  return [];
}

export async function setAutoSchedule(params: {
  schedule: string[];
  title: string;
  daysOfWeek?: number[];
  excludeDates?: string[];
  profileKey?: string | null;
}) {
  return engagementFetch(`/auto-schedule/set`, {
    method: 'POST',
    body: {
      schedule: params.schedule,
      title: params.title,
      ...(params.daysOfWeek ? { daysOfWeek: params.daysOfWeek } : {}),
      ...(params.excludeDates ? { excludeDates: params.excludeDates } : {}),
    },
    profileKey: params.profileKey,
  });
}

export async function deleteAutoSchedule(params: { title: string; profileKey?: string | null }) {
  return engagementFetch(`/auto-schedule/delete`, {
    method: 'DELETE',
    body: { title: params.title },
    profileKey: params.profileKey,
  });
}

// ─── DM Auto-Response ────────────────────────────────────────────────────────

export interface AyrshareAutoResponse {
  autoResponseActive: boolean;
  autoResponseMessage?: string;
  autoResponseWaitSeconds?: number;
  [k: string]: unknown;
}

export async function getAutoResponse(profileKey?: string | null): Promise<AyrshareAutoResponse> {
  const data = await engagementFetch<Record<string, unknown>>(`/messages/autoresponse`, { profileKey });
  return {
    autoResponseActive: Boolean(data?.autoResponseActive),
    autoResponseMessage: typeof data?.autoResponseMessage === 'string' ? (data.autoResponseMessage as string) : undefined,
    autoResponseWaitSeconds: typeof data?.autoResponseWaitSeconds === 'number' ? (data.autoResponseWaitSeconds as number) : undefined,
    ...data,
  };
}

export async function setAutoResponse(params: {
  autoResponseActive: boolean;
  autoResponseMessage?: string;
  autoResponseWaitSeconds?: number;
  profileKey?: string | null;
}) {
  const body: Record<string, unknown> = { autoResponseActive: params.autoResponseActive };
  if (params.autoResponseMessage !== undefined) body.autoResponseMessage = params.autoResponseMessage;
  if (params.autoResponseWaitSeconds !== undefined) body.autoResponseWaitSeconds = params.autoResponseWaitSeconds;
  return engagementFetch<AyrshareAutoResponse>(`/messages/autoresponse`, {
    method: 'POST',
    body,
    profileKey: params.profileKey,
  });
}

// ─── Post analytics (per Ayrshare post ID) ───────────────────────────────────

/**
 * Fetches analytics for a list of Ayrshare post IDs.
 * Returns aggregated totals across all posts.
 */
export async function getPostsAnalytics(
  postIds: string[],
  platforms: string[],
  profileKey?: string | null,
): Promise<{ impressions: number; reach: number; clicks: number } | null> {
  if (!isConfigured() || !postIds.length) return null;
  try {
    const results = await Promise.allSettled(
      postIds.map(id =>
        fetch(`${BASE}/analytics/post`, {
          method: 'POST',
          headers: apiHeaders(profileKey),
          body: JSON.stringify({ id, platforms }),
          next: { revalidate: 300 },
        }).then(r => (r.ok ? r.json() as Promise<PostAnalyticsResult> : null)),
      ),
    );

    let impressions = 0, reach = 0, clicks = 0;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        impressions += r.value.impressions || 0;
        reach       += r.value.reach       || 0;
        clicks      += r.value.clicks      || 0;
      }
    }
    return { impressions, reach, clicks };
  } catch {
    return null;
  }
}
