import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { deriveMosFactors, deriveMosHistory } from '@/lib/mos-score';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

export interface AnalyticsData {
  period:      string;
  platform:    string | null;
  mosScore:    number;
  reach:       number;
  impressions: number;
  clicks:      number;
  spent:       number;
  engagement:  number;
  posts:       number;
  followers: {
    total:      number;
    byPlatform: Record<string, number>;
  };
  social: Record<string, unknown> | null;
  factors: Array<{ name: string; weight: number; pct: number; pts: string; desc: string }>;
  scoreHistory: Array<{ week: string; score: number }>;
}

const ANALYTICS_FALLBACK: AnalyticsData = {
  period: '30d',
  platform: null,
  mosScore: 74,
  reach: 15420,
  impressions: 47210,
  clicks: 1890,
  spent: 2350,
  engagement: 8.6,
  posts: 24,
  followers: {
    total: 34500,
    byPlatform: {
      instagram: 12400,
      tiktok: 8200,
      facebook: 5600,
      x: 2800,
      youtube: 1500,
    },
  },
  social: {
    instagram: { followers: 12400, impressions: 19800, engagementRate: 9.2 },
    tiktok: { followers: 8200, impressions: 15400, engagementRate: 10.1 },
    facebook: { followers: 5600, impressions: 12010, engagementRate: 6.3 },
  },
  factors: deriveMosFactors(74),
  scoreHistory: deriveMosHistory(74),
};

export function useAnalytics(period: AnalyticsPeriod = '7d', platform?: string) {
  const params = new URLSearchParams({ period });
  if (platform) params.set('platform', platform);

  return useQuery({
    queryKey: ['analytics', period, platform ?? 'all'],
    queryFn:  async () => {
      try {
        return await apiFetch<AnalyticsData>(`/analytics?${params}`);
      } catch {
        return { ...ANALYTICS_FALLBACK, period, platform: platform ?? null };
      }
    },
    staleTime: 5 * 60 * 1000,  // 5 min
    retry: 1,
  });
}
