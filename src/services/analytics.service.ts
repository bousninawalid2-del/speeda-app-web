import { apiFetch } from '@/lib/api-client';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

export interface AnalyticsKpi {
  label:  string;
  value:  string;
  change: string;
  icon:   string;
}

export interface AnalyticsPlatform {
  platform:    string;
  followers:   number;
  reach:       number;
  engagement:  number;
  posts:       number;
}

export interface AnalyticsData {
  kpis:      AnalyticsKpi[];
  platforms: AnalyticsPlatform[];
  chartData: Array<{ label: string; value: number }>;
  mosScore:  number;
  period:    AnalyticsPeriod;
}

export const analyticsService = {
  get: (period: AnalyticsPeriod = '7d', platform?: string) => {
    const params = new URLSearchParams({ period });
    if (platform) params.set('platform', platform);
    return apiFetch<AnalyticsData>(`/analytics?${params}`);
  },
};
