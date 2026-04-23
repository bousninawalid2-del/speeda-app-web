import { resolveProfileKey } from '@/lib/ayrshare-engagement';

export { resolveProfileKey };

const TTL_MS = 60_000;
type CacheEntry<T> = { at: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();

export function settingsCacheKey(userId: string | bigint, suffix: string): string {
  return `${String(userId)}::settings::${suffix}`;
}

export async function withSettingsCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await fn();
  cache.set(key, { at: Date.now(), data: data as unknown });
  return data;
}

export function invalidateSettingsCache(userId: string | bigint, suffix?: string) {
  const prefix = `${String(userId)}::settings::`;
  for (const key of cache.keys()) {
    if (!key.startsWith(prefix)) continue;
    if (suffix && !key.endsWith(`::${suffix}`)) continue;
    cache.delete(key);
  }
}
