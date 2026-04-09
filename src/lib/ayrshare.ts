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

function apiHeaders(profileKey?: string | null): HeadersInit {
  const h: HeadersInit = {
    Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
    'Content-Type': 'application/json',
  };
  if (profileKey) (h as Record<string, string>)['Profile-Key'] = profileKey;
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
      headers: apiHeaders(input.profileKey),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[ayrshare:publishPost] ${res.status} ${res.statusText}`, errBody);
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
