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
}

export function useAnalytics(period: AnalyticsPeriod = '7d', platform?: string) {
  const params = new URLSearchParams({ period });
  if (platform) params.set('platform', platform);

  return useQuery({
    queryKey: ['analytics', period, platform ?? 'all'],
    queryFn:  () => apiFetch<AnalyticsData>(`/analytics?${params}`),
    staleTime: 5 * 60 * 1000,  // 5 min
    retry: 1,
  });
}
