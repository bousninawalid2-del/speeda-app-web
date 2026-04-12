/**
 * Simple in-process sliding-window rate limiter.
 *
 * Suitable for single-instance deployments (Vercel Serverless / Node).
 * For multi-instance deployments, replace the Map with a Redis backend.
 *
 * WARNING: single-instance only — use Redis for multi-instance
 */

interface Window {
  count:     number;
  resetAt:   number;
}

const store = new Map<string, Window>();

export interface RateLimitOptions {
  /** Max requests per window */
  limit:      number;
  /** Window size in milliseconds */
  windowMs:   number;
}

/**
 * Returns `true` when the request should be allowed, `false` when rate-limited.
 * Key is typically `${userId}:${route}` or `${ip}:${route}`.
 */
export function rateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }

  if (entry.count >= opts.limit) return false;

  entry.count += 1;
  return true;
}

// Periodically purge expired entries to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);
