import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

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
  chartData?: Array<{ week: string; score: number }>;
  factors?: Array<{ name: string; weight: number; pct: number; pts: string; desc: string }>;
  scoreHistory?: Array<{ week: string; score: number }>;
}

export function useAnalytics(period: AnalyticsPeriod = '7d', platform?: string) {
  const params = new URLSearchParams({ period });
  if (platform) params.set('platform', platform);

  return useQuery({
    queryKey: ['analytics', period, platform ?? 'all'],
    queryFn:  async () => {
      try {
        return await apiFetch<AnalyticsData>(`/analytics?${params}`);
      } catch {
        return {
          period,
          platform: platform ?? null,
          mosScore: 0,
          reach: 0,
          impressions: 0,
          clicks: 0,
          spent: 0,
          engagement: 0,
          posts: 0,
          followers: { total: 0, byPlatform: {} },
          social: null,
          chartData: [],
          scoreHistory: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000,  // 5 min
    retry: 1,
  });
}
